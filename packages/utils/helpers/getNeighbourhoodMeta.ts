import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import {
  DESCRIPTION,
  NAME,
  CREATOR,
  CREATED_AT,
} from "utils/constants/communityPredicates";
import { NeighbourhoodMetaData } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

export function getMetaFromLinks(
  links: LinkExpression[]
): NeighbourhoodMetaData {
  return links.reduce(
    (acc, link) => {
      const { predicate, target } = link.data;
      return {
        name:
          predicate === NAME ? Literal.fromUrl(target).get().data : acc.name,
        description:
          predicate === DESCRIPTION
            ? Literal.fromUrl(target).get().data
            : acc.description,
        author: predicate === CREATOR ? target : acc.author,
        timestamp: predicate === CREATED_AT ? target : acc.timestamp,
      };
    },
    {
      name: "",
      description: "",
      author: "",
      timestamp: "",
    }
  );
}

export default async function getMetaFromNeighbourhood(
  neighbourhoodUrl: string
): Promise<NeighbourhoodMetaData> {
  const client = await getAd4mClient();
  const neighbourhoodExp = await client.expression.get(neighbourhoodUrl);
  const meta = JSON.parse(neighbourhoodExp.data).meta;
  return getMetaFromLinks(meta.links);
}
