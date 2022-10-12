import { Link, LinkExpression } from "@perspect3vism/ad4m";

import {
  CREATOR,
  DESCRIPTION,
  NAME,
  SELF,
  CREATED_AT,
} from "utils/constants/neighbourhoodMeta";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export async function createNeighbourhoodMeta(
  name: string,
  description: string,
  creatorDid: string
): Promise<LinkExpression[]> {
  const client = await getAd4mClient();
  //Create the perspective to hold our meta
  const perspective = await client.perspective.add(`${name}-meta`);

  const nameExpression = await client.expression.create(name, "literal");

  //Create the links we want on meta
  const expressionLinks = [];
  expressionLinks.push(
    new Link({
      source: SELF,
      target: nameExpression,
      predicate: NAME,
    })
  );

  expressionLinks.push(
    new Link({
      source: SELF,
      target: creatorDid,
      predicate: CREATOR,
    })
  );

  expressionLinks.push(
    new Link({
      source: SELF,
      target: new Date().toISOString(),
      predicate: CREATED_AT,
    })
  );

  if (description != "") {
    const descriptionExpression = await client.expression.create(
      description,
      "literal"
    );
    expressionLinks.push(
      new Link({
        source: SELF,
        target: descriptionExpression,
        predicate: DESCRIPTION,
      })
    );
  }

  //Create the links on the perspective
  for (const exp of expressionLinks) {
    await client.perspective.addLink(perspective.uuid, exp);
  }

  //Get the signed links back
  const perspectiveSnapshot = await client.perspective.snapshotByUUID(
    perspective.uuid
  );
  await client.perspective.remove(perspective.uuid);
  const links = [];
  for (const link in perspectiveSnapshot!.links) {
    //Deep copy the object... so we can delete __typename fields inject by apollo client
    const newLink = JSON.parse(
      JSON.stringify(perspectiveSnapshot!.links[link])
    );
    newLink.__typename = undefined;
    newLink.data.__typename = undefined;
    newLink.proof.__typename = undefined;
    links.push(newLink);
  }
  return links;
}
