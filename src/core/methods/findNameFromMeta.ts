import { Perspective } from "@perspect3vism/ad4m-types";

export function findNameFromMeta(perspective: Perspective): string | null {
  //Read out metadata about the perspective from the meta
  let name;
  for (const link of perspective!.links) {
    if (link.data.predicate == "rdf://name") {
      name = link.data.target;
    }
  }
  if (name) {
    return name;
  } else {
    return null;
  }
}
