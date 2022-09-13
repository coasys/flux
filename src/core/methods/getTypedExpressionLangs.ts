import { FluxExpressionReference, ExpressionTypes } from "@/store/types";
import { LinkExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export async function getTypedExpressionLanguages(
  links: LinkExpression[]
): Promise<FluxExpressionReference[]> {
  const client = await getAd4mClient();
  const typedExpressionLanguages = [];
  //Get and cache the expression UI for each expression language
  //And used returned expression language names to populate typedExpressionLanguages field
  for (const link of links) {
    if (link.data.predicate == "language") {
      const languageRes = await client.languages.byAddress(
        link.data.target!
      );
      if (!languageRes) {
        throw Error(
          `Could not find language with address: ${link.data.target}`
        );
      }
      let expressionType;
      if (languageRes.name!.endsWith("group-expression")) {
        expressionType = ExpressionTypes.GroupExpression;
      } else if (languageRes.name!.endsWith("profile-expression")) {
        expressionType = ExpressionTypes.ProfileExpression;
      } else {
        expressionType = ExpressionTypes.Other;
      }
      typedExpressionLanguages.push({
        languageAddress: link.data.target!,
        expressionType: expressionType,
      } as FluxExpressionReference);
    }
  }
  return typedExpressionLanguages;
}
