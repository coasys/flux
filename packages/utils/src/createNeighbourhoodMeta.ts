import { Ad4mClient, Link, LinkExpression, Literal } from '@coasys/ad4m';
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

  // Property values are encoded as deterministic plain literal URIs client-side;
  // the link reifier carries the canonical author/timestamp/proof for the write.
  const nameTarget = Literal.from(name).toUrl();
  const createdAtTarget = Literal.from(new Date().toISOString()).toUrl();

  //Create the links we want on meta
  const expressionLinks = [] as Link[];
  expressionLinks.push(
    new Link({
      source: SELF,
      target: nameTarget,
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
      target: createdAtTarget,
      predicate: CREATED_AT,
    }),
  );

  if (description != '') {
    const descriptionTarget = Literal.from(description).toUrl();
    expressionLinks.push(
      new Link({
        source: SELF,
        target: descriptionTarget,
        predicate: DESCRIPTION,
      }),
    );
  }

  //Create the links on the perspective
  await client.perspective.addLinks(perspective.uuid, expressionLinks);

  //Get the signed links back
  const perspectiveSnapshot = await client.perspective.snapshotByUUID(perspective.uuid);
  await client.perspective.remove(perspective.uuid);
  return Object.values(perspectiveSnapshot!.links);
}
