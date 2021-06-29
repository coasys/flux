import { Commit } from "vuex";

import { ExpressionUIIcons } from "@/store";
import { getLanguages } from "@/core/queries/getLanguages";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  joiningLink: string;
}

export default async ({ commit, getters }: Context): Promise<void> => {
  try {
    const languages = await getLanguages();
    if (!languages) {
      throw new Error("No languages found");
    }
    console.log(languages);
    for (const language of languages) {
      if (language.iconFor) {
        if (!getters.getLanguageUI(language.address!)) {
          console.log(language);
          const uiData: ExpressionUIIcons = {
            languageAddress: language!.address!,
            createIcon: language!.constructorIcon!.code!,
            viewIcon: language!.iconFor!.code!,
            name: language!.name!,
          };
          commit("addExpressionUI", uiData);
        }
      }
    }
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
