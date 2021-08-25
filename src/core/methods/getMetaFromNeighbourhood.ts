import { LinkExpression } from "@perspect3vism/ad4m";
import {
  DESCRIPTION,
  NAME,
  CREATOR,
  CREATED_AT,
} from "@/constants/neighbourhoodMeta";

export function getMetaFromNeighbourhood(links: LinkExpression[]): {
  name: string;
  description: string;
  creatorDid: string;
  createdAt: string;
} {
  return links.reduce((acc, link) => {
    const predicate = link.data.predicate;
    return {
      ...acc,
      name: predicate === NAME ? predicate : acc.name,
      description: predicate === DESCRIPTION ? predicate : acc.description,
      creatorDid: predicate === CREATOR ? predicate : acc.creatorDid,
      createdAt: predicate === CREATED_AT ? predicate : acc.createdAt,
    };
  }, {});
}
