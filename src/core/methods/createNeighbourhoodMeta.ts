import { FluxExpressionReference } from "@/store/types";
import { Link, LinkExpression } from "@perspect3vism/ad4m";

import {
  CREATOR,
  DESCRIPTION,
  NAME,
  SELF,
  LANGUAGE,
  CREATED_AT,
} from "@/constants/neighbourhoodMeta";
import { ad4mClient } from "@/app";

export async function createNeighbourhoodMeta(
  name: string,
  description: string,
  creatorDid: string,
  expressionLanguages: FluxExpressionReference[]
): Promise<LinkExpression[]> {
  //Create the perspective to hold our meta
  const perspective = await ad4mClient.perspective.add(`${name}-meta`);

  //Create the links we want on meta
  const expressionLinks = [];
  expressionLinks.push(
    new Link({
      source: SELF,
      target: name,
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

  //Ad4m-executor throws an error if target is an empty string
  if (description == "") {
    description = "-";
  }
  expressionLinks.push(
    new Link({
      source: SELF,
      target: description,
      predicate: DESCRIPTION,
    })
  );

  for (const lang of expressionLanguages) {
    expressionLinks.push(
      new Link({
        source: SELF,
        target: lang.languageAddress,
        predicate: LANGUAGE,
      })
    );
  }

  //Create the links on the perspective
  for (const exp of expressionLinks) {
    await ad4mClient.perspective.addLink(perspective.uuid, exp);
  }

  //Get the signed links back
  const perspectiveSnapshot = await ad4mClient.perspective.snapshotByUUID(
    perspective.uuid
  );
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
