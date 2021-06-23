import { getLanguage } from "@/core/queries/getLanguage";
import { SharedPerspective } from "@perspect3vism/ad4m-executor";
import {
  JuntoExpressionReference,
  ExpressionTypes,
  ExpressionUIIcons,
} from "@/store";
import { Store } from "vuex";

export async function getTypedExpressionLanguages<S>(
  installedPerspective: SharedPerspective,
  storeLanguageUI: boolean,
  store?: Store<S>
): Promise<JuntoExpressionReference[]> {
  try {
    const typedExpressionLanguages = [];
    //Get and cache the expression UI for each expression language
    //And used returned expression language names to populate typedExpressionLanguages field
    for (const lang of installedPerspective.requiredExpressionLanguages!) {
      console.log("JoinCommunity.vue: Fetching UI lang:", lang);
      const languageRes = await getLanguage(lang!);
      if (storeLanguageUI && store) {
        const uiData: ExpressionUIIcons = {
          languageAddress: lang!,
          createIcon: languageRes.constructorIcon!.code!,
          viewIcon: languageRes.iconFor!.code!,
        };
        store!.commit({
          type: "addExpressionUI",
          value: uiData,
        });
      }
      let expressionType;
      switch (languageRes.name!) {
        case "junto-shortform":
          expressionType = ExpressionTypes.ShortForm;
          break;

        case "group-expression":
          expressionType = ExpressionTypes.GroupExpression;
          break;

        case "agent-profiles":
          expressionType = ExpressionTypes.ProfileExpression;
          break;

        default:
          expressionType = ExpressionTypes.Other;
      }
      typedExpressionLanguages.push({
        languageAddress: lang!,
        expressionType: expressionType,
      } as JuntoExpressionReference);
      //await this.sleep(40);
    }
    return typedExpressionLanguages;
  } catch (error) {
    throw new Error(error);
  }
}
