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
    for (const language of languages) {
      if (language.constructorIcon) {
        if (!getters.getLanguageUI(language.address!)) {
          const uiData: ExpressionUIIcons = {
            languageAddress: language!.address!,
            createIcon: language!.constructorIcon?.code || undefined,
            viewIcon: language!.iconFor?.code || undefined,
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
