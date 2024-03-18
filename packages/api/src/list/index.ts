import { community } from "@coasys/flux-constants";
import {
  SubjectProperty,
  SubjectCollection,
  SDNAClass,
} from "@coasys/ad4m";

const { NAME } = community;

@SDNAClass({
  name: "List",
})
export class List {
  @SubjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @SubjectProperty({
    through: "rdf://order",
    writable: true,
    resolveLanguage: "literal",
  })
  order: string;

  @SubjectCollection({
    through: "ad4m://has_child",
    where: {
      condition: `instance(_, Target)`,
    },
  })
  children: string[] = [];
}

export default List;
