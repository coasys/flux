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
  add: { [x: EntryType]: Function[] };
  remove: { [x: EntryType]: Function[] };
};

export default class Model {
  source = "adm4://self";
  perspectiveUuid = "";
  listeners = { add: {}, remove: {} } as Listeners;
  static type: EntryType;
  static properties: {
    [x: string]: ModelProperty;
  };

  constructor(props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;

    subscribeToLinks({
      perspectiveUuid: this.perspectiveUuid,
      added: (link) => this.onLink("added", link),
      removed: (link) => this.onLink("removed", link),
    });
  }

  async create(data: DataInput, type?: EntryType) {
    const expressions = await this.createExpressions(data);
    return createEntry({
      perspectiveUuid: this.perspectiveUuid,
      source: this.source,
      types: [this.constructor.type],
      data: expressions,
    });
  }

  async createExpressions(data: DataInput) {
    const client = await getAd4mClient();

    const expPromises = Object.entries(data)
      .filter(([key]) => this.constructor.properties[key])
      .map(async ([key, value]) => {
        const { predicate, languageAddress } = this.constructor.properties[key];
        const expUrl = await client.expression.create(value, languageAddress);
        return { predicate, expUrl };
      });

    const expressions = await Promise.all(expPromises);

    return expressions.reduce((acc, exp) => {
      return {
        ...acc,
        [exp.predicate]: exp.expUrl,
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
    console.log(result);
  }

  async getAll(source?: string) {
    console.log({ type: this.constructor.type });
    const result = await queryProlog({
      perspectiveUuid: this.perspectiveUuid,
      type: this.constructor.type,
      source: source || this.source,
      properties: this.constructor.properties,
    });
    console.log(result);
  }

  onLink(type: "added" | "removed", link: LinkExpression) {
    const linkIsType = link.data.predicate === ENTRY_TYPE;

    if (!linkIsType) return;

    const entryId = link.data.source;
    const entryType = link.data.target;
    const addedListeners = this.listeners.add[entryType];
    const removedListeners = this.listeners.remove[entryType];

    if (type === "added" && addedListeners) {
      addedListeners.forEach(async (cb) => {
        const entry = await this.get(entryId);
        cb(entry);
      });
    }
    if (type === "removed" && removedListeners) {
      removedListeners.forEach(async (cb) => {
        const entry = await this.get(entryId);
        cb(entry);
      });
    }
  }

  onAdded(type: EntryType, callback: Function) {
    const hasCallbacks = this.listeners.add[type];
    if (hasCallbacks) {
      this.listeners.add[type].push(callback);
    } else {
      this.listeners.add[type] = [callback];
    }
  }

  onRemoved(type: EntryType, callback: Function) {
    const hasCallbacks = this.listeners.add[type];
    if (hasCallbacks) {
      this.listeners.remove[type].push(callback);
    } else {
      this.listeners.remove[type] = [callback];
    }
  }
}
