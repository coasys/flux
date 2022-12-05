import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { EntryType } from "../types";
import { createEntry } from "../api/createEntry";
import subscribeToLinks from "../api/subscribeToLinks";
import { LinkExpression } from "@perspect3vism/ad4m";
import { ENTRY_TYPE } from "../constants/communityPredicates";
import { ModelProperty } from "../types";
import { queryProlog } from "./prologHelpers";

type ModelProps = {
  perspectiveUuid: string;
  source?: string;
};

type DataInput = {
  [x: string]: any;
};

type Listeners = {
  add: { [source: string]: Function[] };
  remove: { [source: string]: Function[] };
};

export default class Model {
  client = null;
  source = "adm4://self";
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

  async create(data: DataInput) {
    const expressions = await this.createExpressions(data);
    return createEntry({
      perspectiveUuid: this.perspectiveUuid,
      source: this.source,
      types: [this.constructor.type],
      data: expressions,
    });
  }

  async update(id: string, data: DataInput) {
    const expressions = await this.createExpressions(data);
    return updateEntry({
      perspectiveUuid: this.perspectiveUuid,
      id,
      data: expressions,
    });
  }

  private async createExpressions(data: DataInput) {
    const client = await getAd4mClient();

    const expPromises = Object.entries(data)
      .filter(([key]) => this.constructor.properties[key])
      .map(async ([key, val]) => {
        const { predicate, languageAddress, collection } =
          this.constructor.properties[key];

        if (collection) {
          const value = val.map(async (v) => {
            return languageAddress
              ? await client.expression.create(v, languageAddress)
              : v;
          });
          const v = await Promise.all(value);
          return { predicate, value: v };
        }

        const value = languageAddress
          ? await client.expression.create(val, languageAddress)
          : val;

        return { predicate, value };
      });

    const expressions = await Promise.all(expPromises);

    return expressions.reduce((acc, exp) => {
      return {
        ...acc,
        [exp.predicate]: exp.value,
      };
    }, {});
  }

  async get(id: string, source?: string) {
    const result = await queryProlog({
      perspectiveUuid: this.perspectiveUuid,
      id,
      type: this.constructor.type,
      source: source || this.source,
      properties: this.constructor.properties,
    });
    return result.length === 0 ? {} : result[0];
  }

  async getAll(source?: string) {
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
