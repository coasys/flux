import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import {
  DESCRIPTION,
  NAME,
  CREATOR,
  CREATED_AT,
} from "utils/constants/neighbourhoodMeta";

export function getMetaFromNeighbourhood(links: LinkExpression[]): {
  name: string;
  description: string;
  creatorDid: string;
  createdAt: string;
} {
  return links.reduce(
    (acc, link) => {
      const { predicate, target } = link.data;
      return {
        name: predicate === NAME ? Literal.fromUrl(target).get().data : acc.name,
        description: predicate === DESCRIPTION ? Literal.fromUrl(target).get().data : acc.description,
        creatorDid: predicate === CREATOR ? target : acc.creatorDid,
        createdAt: predicate === CREATED_AT ? target : acc.createdAt,
      };
    },
    {
      name: "",
      description: "",
      createdAt: "",
      creatorDid: "",
    }
  );
}
