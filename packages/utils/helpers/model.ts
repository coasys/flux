import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { EntryType } from "../types";
import { createEntry } from "../api/createEntry";
import subscribeToLinks from "../api/subscribeToLinks";
import { LinkExpression } from "@perspect3vism/ad4m";
import { ENTRY_TYPE } from "../constants/communityPredicates";

type ModelProperty = {
  predicate: string;
  type: StringConstructor | NumberConstructor;
  languageAddress: string;
};

type ModelProps = {
  perspectiveUuid: string;
  type?: EntryType;
  source?: string;
  properties?: {
    [x: string]: ModelProperty;
  };
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
  type = "" as EntryType;
  listeners = { add: {}, remove: {} } as Listeners;
  properties = {} as {
    [x: string]: ModelProperty;
  };

  constructor(props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;
    this.properties = props.properties || this.properties;
    this.type = props.type || this.type;
    this.get = this.get.bind(this);
    this.create = this.create.bind(this);
    this.createExpressions = this.createExpressions.bind(this);
    this.onLink = this.onLink.bind(this);

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
      types: [type || this.type],
      data: expressions,
    });
  }

  async createExpressions(data: DataInput) {
    const client = await getAd4mClient();

    const expPromises = Object.entries(data)
      .filter(([key]) => this.properties[key])
      .map(async ([key, value]) => {
        const { predicate, languageAddress } = this.properties[key];
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

  async get(id: string) {
    const client = await getAd4mClient();
    console.log(
      generatePrologQuery(id, this.type, this.source, this.properties)
    );
    const queiries = generatePrologQuery(
      id,
      this.type,
      this.source,
      this.properties
    );
    await client.perspective.queryProlog(this.perspectiveUuid, queiries[0]);
    await client.perspective.queryProlog(this.perspectiveUuid, queiries[1]);
    const links = await client.perspective.queryProlog(
      this.perspectiveUuid,
      queiries[2]
    );
    await client.perspective.queryProlog(this.perspectiveUuid, queiries[3]);
    await client.perspective.queryProlog(this.perspectiveUuid, queiries[4]);
    console.log(links);
  }

  onLink(type: "added" | "removed", link: LinkExpression) {
    const linkIsType = link.data.predicate === ENTRY_TYPE;

    if (!linkIsType) return;

    const entryId = link.data.source;
    const entryType = link.data.target;

    if (type === "added") {
      this.listeners.add[entryType].forEach(async (cb) => {
        const entry = await this.get(entryId);
        cb(entry);
      });
    }
    if (type === "removed") {
      this.listeners.add[entryType].forEach(async (cb) => {
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

function generatePrologQuery(
  id: string,
  type: EntryType,
  source: string,
  properties: {
    [x: string]: ModelProperty;
  }
) {
  const propertyNames = Object.keys(properties).reduce((acc, name) => {
    const concatVal = acc === "" ? "" : ", ";
    return acc.concat(concatVal, capitalizeFirstLetter(name));
  }, "");

  const findProperties = Object.keys(properties).reduce((acc, name) => {
    const property = properties[name];
    const concatVal = acc === "" ? "" : ", ";
    return acc.concat(concatVal, generateFindAll(name, property.predicate));
  }, "");

  const entryQuery = `
    entry_query(Source, Type, Id, Timestamp, Author, ${propertyNames}):-
      link(Source, Type, Id, Timestamp, Author),
      ${findProperties}
  `;

  const entry = `
    entry(Source, Id, Timestamp, Author, ${propertyNames}):- 
      entry_query(Source, "${EntryType.Message}", Id, Timestamp, Author, ${propertyNames})
  `;

  return [
    `assertz((${entryQuery})).`,
    `assertz((${entry})).`,
    `entry("${source}", Id, Timestamp, Author, ${propertyNames}).`,
    `retract((${entryQuery})).`,
    `retract((${entry})).`,
  ];
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateFindAll(propertyName, predicate) {
  const name = capitalizeFirstLetter(propertyName);
  return `findall((${name}, ${name}Timestamp, ${name}Author), link(Source, "${predicate}", ${name}, ${name}Timestamp, ${name}Author), ${name})`;
}
