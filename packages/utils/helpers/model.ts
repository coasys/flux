import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  Entry,
  EntryType,
  PredicateMap,
  PropertyMap,
  PropertyValueMap,
} from "../types";
import { createEntry } from "../api/createEntry";
import subscribeToLinks from "../api/subscribeToLinks";
import { LinkExpression } from "@perspect3vism/ad4m";
import { ModelProperty } from "../types";
import { queryProlog } from "./prologHelpers";
import { updateEntry } from "../api/updateEntry";

type ModelProps = {
  perspectiveUuid: string;
  source?: string;
};

type Listeners = {
  add: { [source: string]: Function[] };
  remove: { [source: string]: Function[] };
};

export default class Model {
  client = null;
  source = "ad4m://self";
  perspectiveUuid = "";
  private isSubcribing = false;
  private listeners = { add: {}, remove: {} } as Listeners;
  static type: EntryType;
  static properties: {
    [x: string]: ModelProperty;
  };

  constructor(props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;
  }

  async create(data: PropertyMap, id?: string) {
    const { predicateMap } = await this.createExpressions(data);
    const entry = await createEntry({
      perspectiveUuid: this.perspectiveUuid,
      source: this.source,
      id: id,
      type: this.constructor.type,
      data: predicateMap,
    });
    return this.get(entry.id);
  }

  async update(id: string, data: PropertyMap) {
    const { predicateMap } = await this.createExpressions(data);
    await updateEntry(this.perspectiveUuid, id, predicateMap);
    return this.get(id);
  }

  private async createExpressions(
    data: PropertyMap
  ): Promise<{ predicateMap: PredicateMap; propertyMap: PropertyValueMap }> {
    const client = await getAd4mClient();
    const propertyValues = {} as PropertyValueMap;

    const expPromises = Object.entries(data)
      .filter(([key]) => {
        const isValidProperty = this.constructor.properties[
          key
        ] as ModelProperty;
        return isValidProperty;
      })
      .map(async ([key, val]) => {
        const { predicate, languageAddress, collection } = this.constructor
          .properties[key] as ModelProperty;

        if (collection) {
          const value = val.map(async (v) => {
            const expression = v || "";
            return languageAddress
              ? await client.expression.create(expression, languageAddress)
              : expression;
          }) as Promise<string>[];
          const v = await Promise.all(value);
          propertyValues[key] = v;
          return { predicate, value: v };
        }

        const expression = val || "";

        const value = languageAddress
          ? await client.expression.create(expression, languageAddress)
          : expression;

        propertyValues[key] = value;

        return { predicate, value };
      });

    const expressions = await Promise.all(expPromises);

    return {
      predicateMap: expressions.reduce((acc, exp) => {
        return {
          ...acc,
          [exp.predicate]: exp.value,
        };
      }, {}),
      propertyMap: propertyValues,
    };
  }

  async get(id: string, source?: string): Promise<Entry | null> {
    const result = await queryProlog({
      perspectiveUuid: this.perspectiveUuid,
      id,
      type: this.constructor.type,
      source: source || this.source,
      properties: this.constructor.properties,
    });
    return result.length === 0 ? null : result[0];
  }

  async getAll(source?: string): Promise<Entry[]> {
    const result = await queryProlog({
      perspectiveUuid: this.perspectiveUuid,
      type: this.constructor.type,
      source: source || this.source,
      properties: this.constructor.properties,
    });
    return result;
  }

  private subscribe() {
    subscribeToLinks({
      perspectiveUuid: this.perspectiveUuid,
      added: (link) => this.onLink("added", link),
      removed: (link) => this.onLink("removed", link),
    });
  }

  private async onLink(type: "added" | "removed", link: LinkExpression) {
    const linkIsType = link.data.predicate === this.constructor.type;

    if (!linkIsType) return;

    const source = link.data.source;
    const entryId = link.data.target;
    const addedListeners = this.listeners.add[source];
    const removedListeners = this.listeners.remove[source];

    if (type === "added" && addedListeners) {
      const entry = await this.get(entryId);
      addedListeners.forEach(async (cb) => {
        cb(entry);
      });
    }
    if (type === "removed" && removedListeners) {
      const entry = await this.get(entryId);
      removedListeners.forEach(async (cb) => {
        cb(entry);
      });
    }
  }

  onAdded(callback: Function, source?: string) {
    if (!this.isSubcribing) {
      this.subscribe();
    }

    const src = source || this.source;
    const hasCallbacks = this.listeners.add[src];

    if (hasCallbacks) {
      this.listeners.add[src].push(callback);
    } else {
      this.listeners.add[src] = [callback];
    }
  }

  onRemoved(callback: Function, source?: string) {
    if (!this.isSubcribing) {
      this.subscribe();
    }

    const src = source || this.source;
    const hasCallbacks = this.listeners.remove[src];

    if (hasCallbacks) {
      this.listeners.remove[src].push(callback);
    } else {
      this.listeners.remove[src] = [callback];
    }
  }
}
