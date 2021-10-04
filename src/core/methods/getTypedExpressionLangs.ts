import { getLanguage } from "@/core/queries/getLanguage";
import { JuntoExpressionReference, ExpressionTypes } from "@/store/types";
import { LinkExpression } from "@perspect3vism/ad4m";

export async function getTypedExpressionLanguages(
  links: LinkExpression[]
): Promise<JuntoExpressionReference[]> {
  const typedExpressionLanguages = [];
  //Parse links on a neighbourhood and search for expression languages we understand
  for (const link of links) {
    if (link.data.predicate == "language") {
      const languageRes = await getLanguage(link.data.target!);
      if (!languageRes) {
        throw Error(
          `Could not find language with address: ${link.data.target}`
        );
      }
      let expressionType;
      if (languageRes.name!.endsWith("shortform-expression")) {
        expressionType = ExpressionTypes.ShortForm;
      } else if (languageRes.name!.endsWith("group-expression")) {
        expressionType = ExpressionTypes.GroupExpression;
      } else if (languageRes.name!.endsWith("profile-expression")) {
        expressionType = ExpressionTypes.ProfileExpression;
      } else {
        expressionType = ExpressionTypes.Other;
      }
      typedExpressionLanguages.push({
        languageAddress: link.data.target!,
        expressionType: expressionType,
      } as JuntoExpressionReference);
    }
  }
  return typedExpressionLanguages;
}
