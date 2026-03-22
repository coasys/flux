import { Ad4mClient, Link, LinkExpression } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
const { CREATOR, DESCRIPTION, NAME, SELF, CREATED_AT } = community;

export async function createNeighbourhoodMeta(
  client: Ad4mClient,
  name: string,
  description: string,
  author: string,
): Promise<LinkExpression[]> {
  //Create the perspective to hold our meta
  const perspective = await client.perspective.add(`${name}-meta`);

  const nameExpression = await client.expression.create(name, 'literal');
  const createdAtExpression = await client.expression.create(new Date().toISOString(), 'literal');

  //Create the links we want on meta
  const expressionLinks = [] as Link[];
  expressionLinks.push(
    new Link({
      source: SELF,
      target: nameExpression,
      predicate: NAME,
    }),
  );

  expressionLinks.push(
    new Link({
      source: SELF,
      target: author,
      predicate: CREATOR,
    }),
  );

  expressionLinks.push(
    new Link({
      source: SELF,
      target: createdAtExpression,
      predicate: CREATED_AT,
    }),
  );

  if (description != '') {
    const descriptionExpression = await client.expression.create(description, 'literal');
    expressionLinks.push(
      new Link({
        source: SELF,
        target: descriptionExpression,
        predicate: DESCRIPTION,
      }),
    );
  }

  //Create the links on the perspective
  await client.perspective.addLinks(perspective.uuid, expressionLinks);

  //Get the signed links back
  const perspectiveSnapshot = await client.perspective.snapshotByUUID(perspective.uuid);
  await client.perspective.remove(perspective.uuid);
  const links = [] as LinkExpression[];
  for (const link in perspectiveSnapshot!.links) {
    links.push(perspectiveSnapshot!.links[link]);
  }
  return links;
  return links;
}
