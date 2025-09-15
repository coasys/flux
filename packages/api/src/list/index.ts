import { community } from "@coasys/flux-constants";
import { Property, Collection, ModelOptions, Ad4mModel } from "@coasys/ad4m";

const { NAME } = community;

@ModelOptions({
  name: "List",
})
export class List extends Ad4mModel {
  @Property({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @Property({
    through: "rdf://order",
    writable: true,
    resolveLanguage: "literal",
  })
  order: string;

  @Collection({
    through: "ad4m://has_child",
    where: {
      condition: `instance(_, Target)`,
    },
  })
  children: string[] = [];
}

export default List;
