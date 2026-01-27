import { Ad4mClient, LinkExpression, Literal } from '@coasys/ad4m';
import { NeighbourhoodMetaData } from '@coasys/flux-types';
import { community } from '@coasys/flux-constants';

const { DESCRIPTION, NAME, CREATOR, CREATED_AT } = community;

export function getMetaFromLinks(links: LinkExpression[]): NeighbourhoodMetaData {
  return links.reduce(
    (acc, link) => {
      const { predicate, target } = link.data;
      return {
        name: predicate === NAME ? Literal.fromUrl(target).get().data : acc.name,
        description: predicate === DESCRIPTION ? Literal.fromUrl(target).get().data : acc.description,
        author: predicate === CREATOR ? target : acc.author,
        timestamp: predicate === CREATED_AT ? target : acc.timestamp,
      };
    },
    {
      name: '',
      description: '',
      author: '',
      timestamp: '',
    },
  );
}

export async function getMetaFromNeighbourhood(client: Ad4mClient, neighbourhoodUrl: string): Promise<NeighbourhoodMetaData> {
  const neighbourhoodExp = await client.expression.get(neighbourhoodUrl);
  const meta = JSON.parse(neighbourhoodExp.data).meta;
  return getMetaFromLinks(meta.links);
}
