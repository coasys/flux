import {
  PerspectiveProxy,
  Link,
  Subject,
  LinkExpression,
  Ad4mClient,
} from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { subscribeToLinks } from "../api";
import { SELF } from "../constants/communityPredicates";
import { collectionToAdderName, collectionToSetterName } from "../helpers";
import { PropertyMap, PropertyValueMap } from "../types";
import { v4 as uuidv4 } from "uuid";

export type ModelProps = {
  perspectiveUuid: string;
  source?: string;
};

export type Listeners = {
  add: { [source: string]: Function[] };
  remove: { [source: string]: Function[] };
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
  client = null;
  source = SELF;
  perspectiveUuid = "";
  private unsubscribeCb: Function | null = null;
  private isSubcribing = false;
  private listeners = { add: {}, remove: {} } as Listeners;
  private subject: SubjectClass;
  private perspective: PerspectiveProxy | null = null;
  private tempSubject: any;

  constructor(subject: { new (): SubjectClass }, props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;
    this.subject = new subject();
    this.tempSubject = subject;
  }

  async ensurePerspective() {
    if (!this.perspective) {
      const ad4mClient = await getAd4mClient();
      this.perspective = await ad4mClient.perspective.byUUID(
        this.perspectiveUuid
      );
    }

    await this.perspective?.ensureSDNASubjectClass(this.tempSubject);
  }

  async create(data: SubjectClass, id?: string): Promise<SubjectClass> {
    const base = id || `flux_entry://${uuidv4()}`;
    await this.ensurePerspective();
    let newInstance = await this.perspective?.createSubject(this.subject, base);
    if (!newInstance) {
      throw "Failed to create new instance of " + this.subject.type;
    }

    // Connect new instance to source
    await this.perspective?.add(
      new Link({
        source: this.source,
        predicate: await newInstance.type,
        target: base,
      })
    );

    Object.keys(data).forEach((key) =>
      data[key] === undefined ? delete data[key] : {}
    );

    setProperties(newInstance, data);
    return newInstance;
  }

  async update(id: string, data: QueryPartialEntity<SubjectClass>) {
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
    return instance;
  }

  async get(id?: string): Promise<SubjectClass | null> {
    if (id) {
      await this.ensurePerspective();
      return (
        (await this.perspective?.getSubjectProxy(id, this.subject)) || null
      );
    } else {
      const all = await this.getAll();
      return all[0] || null;
    }
  }

  async getAll(source?: string): Promise<SubjectClass[]> {
    const tempSource = source || this.source;
    await this.ensurePerspective();
    const subjectClass =
      await this.perspective!.stringOrTemplateObjectToSubjectClass(
        this.subject
      );

    const results = await this.perspective?.infer(
      `triple("${tempSource}", ${
        tempSource !== SELF ? `"${this.tempSubject.prototype.type}"` : "_"
      }, X), instance(Class, X), subject_class("${subjectClass}", Class)`
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

  private async subscribe() {
    this.unsubscribeCb = await subscribeToLinks({
      perspectiveUuid: this.perspectiveUuid,
      added: (link) => this.onLink("added", link),
      removed: (link) => this.onLink("removed", link),
    });
  }

  unsubscribe() {
    if (this.unsubscribeCb) {
      this.unsubscribeCb();
      this.listeners = { add: {}, remove: {} };
      this.isSubcribing = false;
    }
  }

  private async onLink(type: "added" | "removed", link: LinkExpression) {
    const linkIsType = link.data.predicate === this.tempSubject.prototype.type;
    
    if (!linkIsType) return;
    
    const source = link.data.source;
    const entryId = link.data.target;
    const addedListeners = this.listeners.add[source];
    const removedListeners = this.listeners.remove[source];
    const allAddListeners = this.listeners.add?.all;
    const allRemoveListeners = this.listeners.remove?.all;

    if (type === "added" && allAddListeners) {
      const entry = await this.get(entryId);
      allAddListeners.forEach((cb) => {
        cb(entry);
      });
    }

    if (type === "removed" && allRemoveListeners) {
      const entry = await this.get(entryId);
      allRemoveListeners.forEach((cb) => {
        cb(entry);
      });
    }

    if (type === "added" && addedListeners) {
      const entry = await this.get(entryId);
      addedListeners.forEach((cb) => {
        cb(entry);
      });
    }

    if (type === "removed" && removedListeners) {
      //const entry = await this.get(entryId);
      removedListeners.forEach((cb) => {
        cb(entryId);
      });
    }
  }

  onAdded(callback: (entry: any) => void, source?: string | "all") {
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

  onRemoved(callback: (id: string) => void, source?: string | "all") {
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

export type QueryPartialEntity<T> = {
  [P in keyof T]?: T[P] | (() => string);
};
