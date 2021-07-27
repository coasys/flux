import { JuntoExpressionReference } from "@/store/types";
import { Link, LinkExpression } from "@perspect3vism/ad4m-types";
import { expressionSign } from "../mutations/expressionSign";

export default async function (
  name: string,
  description: string,
  expressionLanguages: JuntoExpressionReference[]
): Promise<LinkExpression[]> {
  const expressionLinks = [];
  //Create the links we want on meta
  expressionLinks.push(
    new Link({
      source: "self",
      target: name,
      predicate: "rdf://name",
    })
  );

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

  const signedLinkExps = [];

  for (const exp of expressionLinks) {
    const signedExp = await expressionSign(JSON.stringify(exp));
    console.warn(signedExp);
    signedExp.data = JSON.parse(signedExp.data) as Link;
    delete signedExp.__typename;
    delete signedExp.proof.__typename;
    signedLinkExps.push(signedExp as LinkExpression);
  }

  return signedLinkExps;
}
