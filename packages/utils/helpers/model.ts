import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { EntryType } from "../types";
import { createEntry } from "../api/createEntry";

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

export default class Model {
  source = "adm4://self";
  perspectiveUuid = "";
  type = "" as EntryType;
  properties = {} as {
    [x: string]: ModelProperty;
  };

  constructor(props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;
    this.properties = props.properties || this.properties;
    this.type = props.type || this.type;
    this.create = this.create.bind(this);
    this.createExpressions = this.createExpressions.bind(this);
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
    const links = await client.perspective.queryProlog(
      this.perspectiveUuid,
      generatePrologQuery(id, this.type, this.source, this.properties)
    );
    console.log(links);
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

  return `
  assertz(entry_query(Source, Type, Id, Timestamp, ${propertyNames}):- 
    link(Source, Type, Id, Timestamp, Author),
    ${findProperties}.)

  assertz(entry(Source, Id, Timestamp, Author, ${propertyNames}):- 
    entry_query(Source, "${type}", Id, Timestamp, ${propertyNames}).)

  limit(50, (order_by([desc(Timestamp)], flux_post_query_popular("${source}", "${id}", Timestamp, Author, ${propertyNames})))).
  `;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateFindAll(propertyName, predicate) {
  const name = capitalizeFirstLetter(propertyName);
  return `findall(${name}, ${name}Timestamp, ${name}Author), link(Id, "${predicate}", ${name}, ${name}Timestamp, ${name}Author), ${name})`;
}
