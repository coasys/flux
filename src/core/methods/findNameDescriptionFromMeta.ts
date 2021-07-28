import { LinkExpression } from "@perspect3vism/ad4m-types";

export function findNameDescriptionFromMeta(links: LinkExpression[]): {
  name: string;
  description: string;
} {
  //Read out metadata about the perspective from the meta
  let name = "";
  let description = "";
  for (const link of links) {
    if (link.data.predicate == "rdf://name") {
      name = link.data.target;
    }
    if (link.data.predicate == "rdf://description") {
      description = link.data.target;
    }
  }
  return { name, description };
}
