import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { EntryType } from "../types";
import { createEntry } from "../api/createEntry";

type ModelProperty = {
  predicate: string;
  name: string;
  type: "String" | "Number";
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
  createEx;
  properties = {} as {
    [x: string]: ModelProperty;
  };

  constructor(props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;
    this.properties = props.properties || this.properties;
    this.type = props.type || this.type;
    this.createExpressions = this.createExpressions.bind(this);
  }

  async create(data: DataInput, type?: EntryType) {
    const expressions = await this.createExpressions(data);
    return createEntry({
      perspectiveUuid: this.perspectiveUuid,
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
}
