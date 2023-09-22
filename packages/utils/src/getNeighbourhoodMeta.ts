import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { NeighbourhoodMetaData } from "@fluxapp/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { community } from "@fluxapp/constants";

const { DESCRIPTION, NAME, CREATOR, CREATED_AT } = community;

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

export async function getMetaFromNeighbourhood(
  neighbourhoodUrl: string
): Promise<NeighbourhoodMetaData> {
  const client = await getAd4mClient();
  const neighbourhoodExp = await client.expression.get(neighbourhoodUrl);
  const meta = JSON.parse(neighbourhoodExp.data).meta;
  return getMetaFromLinks(meta.links);
}
