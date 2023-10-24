import {
  PerspectiveProxy,
  Link,
  Subject,
  Literal,
  LinkQuery,
} from "@perspect3vism/ad4m";
import { community } from "@fluxapp/constants";
import { setProperties } from "./model";
import { v4 as uuidv4 } from "uuid";

const { SELF } = community;

export type ModelProps = {
  perspective: PerspectiveProxy;
  source?: string;
};

export class SubjectRepository<SubjectClass extends { [x: string]: any }> {
  source = SELF;
  subject: SubjectClass | string;
  perspective: PerspectiveProxy;
  tempSubject: any | string;

  constructor(subject: { new (): SubjectClass } | string, props: ModelProps) {
    this.perspective = props.perspective;
    this.source = props.source || this.source;
    this.subject = typeof subject === "string" ? subject : new subject();
    this.tempSubject = subject;
  }

  get className(): string {
    return typeof this.subject === "string"
      ? this.subject
      : this.subject.className;
  }

  async ensureSubject() {
    if (typeof this.tempSubject === "string") return;
    await this.perspective.ensureSDNASubjectClass(this.tempSubject);
  }

  async create(
    data: SubjectClass,
    id?: string,
    source?: string
  ): Promise<SubjectClass> {
    await this.ensureSubject();
    const base = id || Literal.from(uuidv4()).toUrl();

    let newInstance = await this.perspective.createSubject(this.subject, base);

    if (!newInstance) {
      throw "Failed to create new instance of " + this.subject;
    }

    // Connect new instance to source
    await this.perspective.add(
      new Link({
        source: source || this.source,
        predicate: "rdf://has_child",
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
      throw "Failed to find instance of " + this.subject + " with id " + id;
    }

    Object.keys(data).forEach((key) =>
      data[key] === undefined ? delete data[key] : {}
    );

    setProperties(instance, data);

    return this.getSubjectData(instance);
  }

  async remove(id: string) {
    if (this.perspective) {
      const linksTo = await this.perspective.get(new LinkQuery({ target: id }));
      const linksFrom = await this.perspective.get(
        new LinkQuery({ source: id })
      );
      this.perspective.removeLinks([...linksFrom, ...linksTo]);
    }
  }

  async get(id: string): Promise<SubjectClass | null> {
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

  async getData(id: string): Promise<SubjectClass | string | null> {
    await this.ensureSubject();
    const entry = await this.get(id);
    if (entry) {
      return await this.getSubjectData(entry);
    }

    return null;
  }

  private async getSubjectData(entry: any) {
    let links = await this.perspective.get(
      new LinkQuery({ source: entry.baseExpression })
    );

    const getters = Object.entries(Object.getOwnPropertyDescriptors(entry))
      .filter(([key, descriptor]) => typeof descriptor.get === "function")
      .map(([key]) => key);

    const promises = getters.map((getter) => entry[getter]);
    return Promise.all(promises).then((values) => {
      return getters.reduce((acc, getter, index) => {
        let value = values[index];
        if (this.tempSubject.prototype?.__properties[getter]?.transform) {
          value =
            this.tempSubject.prototype.__properties[getter].transform(value);
        }

        return {
          ...acc,
          id: entry.baseExpression,
          timestamp: links[0].timestamp,
          author: links[0].author,
          [getter]: value,
        };
      }, {});
    });
  }

  async getAll(source?: string, query?: QueryOptions): Promise<SubjectClass[]> {
    await this.ensureSubject();

    const tempSource = source || this.source;

    let res = [];

    if (query) {
      try {
        const queryResponse = (await this.perspective.infer(`findall([Timestamp, Base], (subject_class("${this.className}", C), instance(C, Base), link("${tempSource}", Predicate, Base, Timestamp, Author)), AllData), length(AllData, DataLength).`))[0]

        if (queryResponse.DataLength >= query.size) {
          const isOutofBound = query.size * query.page > queryResponse.DataLength;

          const newPageSize = isOutofBound ? queryResponse.DataLength - (query.size * (query.page - 1)) : query.size;

          const mainQuery = `findall([Timestamp, Base], (subject_class("${this.className}", C), instance(C, Base), link("${tempSource}", Predicate, Base, Timestamp, Author)), AllData), sort(AllData, SortedData), reverse(SortedData, ReverseSortedData), paginate(ReverseSortedData, ${query.page}, ${newPageSize}, PageData).`

          res = await this.perspective.infer(mainQuery);

          res = res[0].PageData.map(r => ({
            Base: r[1],
            Timestamp: r[0]
          }))
        } else {
          res = await this.perspective.infer(
            `subject_class("${this.className}", C), instance(C, Base), triple("${tempSource}", Predicate, Base).`
          );
        }
      } catch (e) {
        console.log("Query failed", e);
      }
    } else {
      res = await this.perspective.infer(
        `subject_class("${this.className}", C), instance(C, Base), triple("${tempSource}", Predicate, Base).`
      );
    }

    const results =
      res &&
      res.filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.Base === obj.Base)
      );

    if (!results) return [];

    return await Promise.all(
      results.map(async (result) => {
        let subject = new Subject(
          this.perspective!,
          result.Base,
          this.className
        );

        await subject.init();

        return subject;
      })
    );
  }

  async getAllData(
    source?: string,
    query?: QueryOptions
  ): Promise<SubjectClass[]> {
    await this.ensureSubject();

    const subjects = await this.getAll(source, query);

    const entries = await Promise.all(
      subjects.map((e) => this.getSubjectData(e))
    );

    return entries;
  }
}

export type QueryPartialEntity<T> = {
  [P in keyof T]?: T[P] | (() => string);
};

export type QueryOptions = {
  page: number;
  size: number;
  infinite: boolean;
  uniqueKey: string;
};
