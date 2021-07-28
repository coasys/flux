import { JuntoExpressionReference } from "@/store/types";
import { Link, LinkExpression } from "@perspect3vism/ad4m-types";
import { addPerspective } from "../mutations/addPerspective";
import { createLink } from "../mutations/createLink";
import { getPerspectiveSnapshot } from "../queries/getPerspective";

export default async function (
  name: string,
  description: string,
  expressionLanguages: JuntoExpressionReference[]
): Promise<LinkExpression[]> {
  //Create the perspective to hold our meta
  const perspective = await addPerspective(`${name}-meta`);

  //Create the links we want on meta
  const expressionLinks = [];
  expressionLinks.push(
    new Link({
      source: "self",
      target: name,
      predicate: "rdf://name",
    })
  );

  //Ad4m-executor throws an error if target is an empty string
  if (description == "") {
    description = "-";
  }
  expressionLinks.push(
    new Link({
      source: "self",
      target: description,
      predicate: "rdf://description",
    })
  );

  for (const lang of expressionLanguages) {
    expressionLinks.push(
      new Link({
        source: "self",
        target: lang.languageAddress,
        predicate: "language",
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
