import { Commit } from "vuex";

import { ExpressionUIIcons } from "@/store";
import { getLanguage } from "@/core/queries/getLanguage";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  joiningLink: string;
}

export default async ({ commit, getters }: Context): Promise<void> => {
  try {
    const expressionLangs = getters.getAllExpressionLanguagesNotLoaded;
    // console.log({ expressionLangs });
    for (const [, lang] of expressionLangs.entries()) {
      const language = await getLanguage(lang);
      console.log("Got language", language);
      if (language !== null) {
        const uiData: ExpressionUIIcons = {
          languageAddress: language!.address!,
          createIcon: language!.constructorIcon!.code!,
          viewIcon: language!.iconFor!.code!,
        };
        commit("addExpressionUI", uiData);
      }
    }
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
