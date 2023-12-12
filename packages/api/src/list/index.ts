import { community } from "@coasys/flux-constants";
import {
  subjectProperty,
  subjectCollection,
  SDNAClass,
} from "@perspect3vism/ad4m";

const { NAME } = community;

@SDNAClass({
  name: "List",
})
export class List {
  @subjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @subjectProperty({
    through: "rdf://order",
    writable: true,
    resolveLanguage: "literal",
  })
  order: string;

  @subjectCollection({
    through: "rdf://has_child",
    where: {
      condition: `instance(_, Target)`,
    },
  })
  children: string[] = [];
}

export default List;
