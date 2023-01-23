import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { PropertyMap, PropertyValueMap } from "../types";
import subscribeToLinks from "../api/subscribeToLinks";
import { LinkExpression, PerspectiveProxy, Subject } from "@perspect3vism/ad4m";
import { SELF } from "../constants/communityPredicates";
import { v4 as uuidv4 } from "uuid";

type ModelProps = {
  perspectiveUuid: string;
  source?: string;
};

type Listeners = {
  add: { [source: string]: Function[] };
  remove: { [source: string]: Function[] };
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// e.g. "name" -> "setName"
function propertyNameToSetterName(property: string): string {
  return `set${capitalize(property)}`;
}

function setProperties(subject: any, properties: PropertyValueMap) {
  Object.keys(properties).forEach((key) => {
    const setterName = propertyNameToSetterName(key);
    const setterFunction = subject[setterName];
    if (setterFunction) {
      setterFunction(properties[key]);
    } else {
      throw "No setter function found for property: " + key;
    }
  });
}

export class Factory<SubjectClass extends { type: string }> {
  client = null;
  source = SELF;
  perspectiveUuid = "";
  private unsubscribeCb: Function | null = null;
  private isSubcribing = false;
  private listeners = { add: {}, remove: {} } as Listeners;
  private subject: SubjectClass;
  private perspective: PerspectiveProxy | null = null;

  constructor(subject: SubjectClass, props: ModelProps) {
    this.perspectiveUuid = props.perspectiveUuid;
    this.source = props.source || this.source;
    this.subject = subject;
  }

  async ensurePerspective() {
    if (!this.perspective) {
      const ad4mClient = await getAd4mClient();
      this.perspective = await ad4mClient.perspective.byUUID(
        this.perspectiveUuid
      );
    }
  }

  async create(data: PropertyMap, id?: string): Promise<SubjectClass> {
    const base = id || `flux_entry://${uuidv4()}`;
    await this.ensurePerspective();
    let newInstance = await this.perspective?.createSubject(this.subject, base);
    if (!newInstance) {
      throw "Failed to create new instance of " + this.subject.type;
    }

    setProperties(newInstance, data);
    return newInstance;
  }

  async update(id: string, data: PropertyMap) {
    const instance = await this.get(id);
    if (!instance) {
      throw (
        "Failed to find instance of " + this.subject.type + " with id " + id
      );
    }
    setProperties(instance, data);
    return instance;
  }

  async get(id: string): Promise<SubjectClass | null> {
    await this.ensurePerspective();
    return (await this.perspective?.getSubjectProxy(id, this.subject)) || null;
  }

  async getAll(source?: string): Promise<SubjectClass[]> {
    await this.ensurePerspective();
    const subjectClass =
      await this.perspective!.stringOrTemplateObjectToSubjectClass(
        this.subject
      );
    const results = await this.perspective?.infer(
      `triple(${source}, _, X), instance(Class, X), subject_class(${subjectClass}, Class)`
    );

    if (!results) return [];

    return await Promise.all(
      results.map(async (result) => {
        let subject = new Subject(this.perspective!, result.X, subjectClass);
        await subject.init();
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
    const linkIsType = link.data.predicate === this.subject.type;

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
