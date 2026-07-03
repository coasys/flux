import { Ad4mClient, Link, LinkExpression } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
const { CREATOR, DESCRIPTION, NAME, SELF, CREATED_AT } = community;

export async function createNeighbourhoodMeta(
  client: Ad4mClient,
  perspectiveUuid: string,
  name: string,
  description: string,
  author: string,
): Promise<LinkExpression[]> {
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

  // Sign the links by round-tripping them through the community's own perspective
  // (addLinks already returns fully signed LinkExpressions) instead of a dedicated
  // scratch perspective. Creating a separate perspective here — even briefly —
  // registers it with the executor and broadcasts perspective-added/removed events to
  // every connected client, which is what caused a transient "<name>-meta" entry to
  // flash in host apps (e.g. WE's sidebar) that list all perspectives.
  // Status must be 'local': perspectiveUuid may belong to an already-published
  // neighbourhood (e.g. a WE space Flux is attaching to), and only 'shared' links are
  // included in the link language's outbound sync — 'local' keeps this transient
  // signing round-trip from ever reaching peers.
  const signedLinks = await client.perspective.addLinks(perspectiveUuid, expressionLinks, 'local');
  await client.perspective.removeLinks(perspectiveUuid, signedLinks);
  return signedLinks;
}
