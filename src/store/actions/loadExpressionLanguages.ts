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
    for (const language of languages) {
      if (!getters.hasLanguageUI(language.address!)) {
        const uiData: ExpressionUIIcons = {
          languageAddress: language!.address!,
          createIcon: language!.constructorIcon!.code!,
          viewIcon: language!.iconFor!.code!,
          name: language!.name!,
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
