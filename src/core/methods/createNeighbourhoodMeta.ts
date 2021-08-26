import { JuntoExpressionReference } from "@/store/types";
import { Link, LinkExpression } from "@perspect3vism/ad4m";
import { addPerspective } from "../mutations/addPerspective";
import { createLink } from "../mutations/createLink";
import { getPerspectiveSnapshot } from "../queries/getPerspective";

import {
  CREATOR,
  DESCRIPTION,
  NAME,
  SELF,
  LANGUAGE,
  CREATED_AT,
} from "@/constants/neighbourhoodMeta";

export async function createNeighbourhoodMeta(
  name: string,
  description: string,
  creatorDid: string,
  expressionLanguages: JuntoExpressionReference[]
): Promise<LinkExpression[]> {
  //Create the perspective to hold our meta
  const perspective = await addPerspective(`${name}-meta`);

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
    await createLink(perspective.uuid, exp);
  }

  //Get the signed links back
  const perspectiveSnapshot = await getPerspectiveSnapshot(perspective.uuid);
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
