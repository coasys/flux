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
    const { predicate, target } = link.data;
    return {
      name: predicate === NAME ? target : acc.name,
      description: predicate === DESCRIPTION ? target : acc.description,
      creatorDid: predicate === CREATOR ? target : acc.creatorDid,
      createdAt: predicate === CREATED_AT ? target : acc.createdAt,
    };
  }, {
    name: '',
    description: '',
    createdAt: '',
    creatorDid: ''
  });
}
