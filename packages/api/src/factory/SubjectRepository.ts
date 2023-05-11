import {
  PerspectiveProxy,
  Link,
  Subject,
  Literal,
  LinkQuery,
} from "@perspect3vism/ad4m";
import { community } from "@fluxapp/constants";
import {
  collectionToAdderName,
  collectionToSetterName,
  SubjectEntry,
} from "./model";
import { v4 as uuidv4 } from "uuid";

const { SELF } = community;

export type ModelProps = {
  perspective: PerspectiveProxy;
  source?: string;
};

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// e.g. "name" -> "setName"
export function propertyNameToSetterName(property: string): string {
  return `set${capitalize(property)}`;
}

export function pluralToSingular(plural: string): string {
  if (plural.endsWith("ies")) {
    return plural.slice(0, -3) + "y";
  } else if (plural.endsWith("s")) {
    return plural.slice(0, -1);
  } else {
    return plural;
  }
}

export function setProperties(
  subject: any,
  properties: QueryPartialEntity<{ [x: string]: any }>
) {
  const adder = (key: string, value: any) => {
    // it's a collection
    const adderName = collectionToAdderName(key);
    const adderFunction = subject[adderName];
    if (adderFunction) {
      adderFunction(value);
    } else {
      throw "No adder function found for collection: " + key;
    }
  };

  const setter = (key: string, value: any) => {
    // it's a collection
    const setterName = collectionToSetterName(key);
    const setterFunction = subject[setterName];
    if (setterFunction) {
      setterFunction(value);
    } else {
      throw "No adder function found for collection: " + key;
    }
  };

  Object.keys(properties).forEach((key) => {
    if (
      Array.isArray(properties[key]) ||
      Array.isArray(properties[key]?.value)
    ) {
      if (properties[key].action) {
        switch (properties[key].action) {
          case "setter":
            setter(key, properties[key].value);
            break;
          case "adder":
            adder(key, properties[key].value);
            break;
          default:
            setter(key, properties[key].value);
            break;
        }
      } else {
        // it's a collection
        setter(key, properties[key]);
      }
      // console.log('llll 5', key, adderName, subject,adderFunction, properties[key])
    } else {
      // it's a property
      const setterName = propertyNameToSetterName(key);
      const setterFunction = subject[setterName];
      if (setterFunction) {
        setterFunction(properties[key]);
      } else {
        throw "No setter function found for property: " + key;
      }
    }
  });
}

export class SubjectRepository<SubjectClass extends { [x: string]: any }> {
  source = SELF;
  subject: SubjectClass;
  perspective: PerspectiveProxy;
  tempSubject: any;

  constructor(subject: { new (): SubjectClass }, props: ModelProps) {
    this.perspective = props.perspective;
    this.source = props.source || this.source;
    this.subject = new subject();
    this.tempSubject = subject;
  }

  async ensureSubject() {
    await this.perspective.ensureSDNASubjectClass(this.tempSubject);
  }

  async create(data: SubjectClass, id?: string): Promise<SubjectClass> {
    await this.ensureSubject();
    const base = id || Literal.from(uuidv4()).toUrl();

    let newInstance = await this.perspective.createSubject(this.subject, base);

    if (!newInstance) {
      throw "Failed to create new instance of " + this.subject.type;
    }

    // Connect new instance to source
    await this.perspective.add(
      new Link({
        source: this.source,
        predicate: await newInstance.type,
        target: base,
      })
    );

    Object.keys(data).forEach((key) =>
      data[key] === undefined || data[key] === null ? delete data[key] : {}
    );

    setProperties(newInstance, data);

    return this.getSubjectData(newInstance);
  }

  async update(id: string, data: QueryPartialEntity<SubjectClass>) {
    await this.ensureSubject();
    const instance = await this.get(id);
    if (!instance) {
      throw (
        "Failed to find instance of " + this.subject.type + " with id " + id
      );
    }

    Object.keys(data).forEach((key) =>
      data[key] === undefined ? delete data[key] : {}
    );

    setProperties(instance, data);
    return this.getSubjectData(instance);
  }

  async remove(id: string) {
    if (this.perspective) {
      const links = await this.perspective.get(
        new LinkQuery({ source: this.source, target: id })
      );
      this.perspective.removeLinks(links);
    }
  }

  async get(id?: string): Promise<SubjectClass | null> {
    await this.ensureSubject();
    if (id) {
      const subjectProxy = await this.perspective.getSubjectProxy(
        id,
        this.subject
      );
      return subjectProxy || null;
    } else {
      const all = await this.getAll();
      return all[0] || null;
    }
  }

  async getData(id?: string): Promise<SubjectClass | null> {
    await this.ensureSubject();
    const entry = await this.get(id);
    if (entry) {
      return await this.getSubjectData(entry);
    }

    return null;
  }

  private async getSubjectData(entry: any) {
    await this.ensureSubject();
    const dataEntry = new SubjectEntry(entry, this.perspective);

    await dataEntry.load();

    const properties = this.tempSubject.prototype.__properties || {};
    const collections = this.tempSubject.prototype.__collections || {};

    const obj: SubjectClass = {};

    await Promise.all(
      Object.entries(properties).map(async ([key, opts]) => {
        const value = await entry[key];
        obj[key] = opts?.transform ? opts.transform(value) : value;
      })
    );

    await Promise.all(
      Object.entries(collections).map(async ([key, opts]) => {
        const value = await entry[key];
        obj[key] = opts?.transform ? opts.transform(value) : value;
      })
    );

    return {
      ...obj,
      id: await entry.baseExpression,
      timestamp: dataEntry.timestamp,
      author: dataEntry.author,
    };
  }

  async getAll(source?: string): Promise<SubjectClass[]> {
    await this.ensureSubject();

    const tempSource = source || this.source;

    const subjectClass =
      await this.perspective.stringOrTemplateObjectToSubjectClass(this.subject);

    // TODO: This return too many
    const res = await this.perspective.infer(
      `triple("${tempSource}", ${
        tempSource !== SELF ? `"${this.tempSubject.prototype.type}"` : "_"
      }, X), instance(Class, X), subject_class("${subjectClass}", Class)`
    );

    const results =
      res &&
      res.filter(
        (obj, index, self) => index === self.findIndex((t) => t.X === obj.X)
      );

    if (!results) return [];

    return await Promise.all(
      results.map(async (result) => {
        let subject = new Subject(this.perspective!, result.X, subjectClass);
        await subject.init();

        return subject;
      })
    );
  }

  async getAllData(source?: string): Promise<SubjectClass[]> {
    await this.ensureSubject();
    const entries = await this.getAll(source);
    return await Promise.all(entries.map((e) => this.getSubjectData(e)));
  }
}

export type QueryPartialEntity<T> = {
  [P in keyof T]?: T[P] | (() => string);
};
