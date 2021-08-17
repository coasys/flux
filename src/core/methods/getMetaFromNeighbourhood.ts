import { LinkExpression } from "@perspect3vism/ad4m";

export function getMetaFromNeighbourhood(links: LinkExpression[]): {
  name: string;
  description: string;
  creatorDid: string;
} {
  //Read out metadata about the perspective from the meta
  let name = "";
  let description = "";
  let creatorDid = "";
  for (const link of links) {
    if (link.data.predicate == "rdf://name") {
      name = link.data.target;
    }
    if (link.data.predicate == "rdf://description") {
      description = link.data.target;
    }
    if (link.data.predicate == "rdf://creator") {
      creatorDid = link.data.target;
    }
  }
  return { name, description, creatorDid };
}
