import { getLanguages } from "@/core/queries/getLanguages";

import { rootActionContext, rootGetterContext } from "@/store/index";
import { ExpressionUIIcons } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async (context: any): Promise<void> => {
  const { getters } = rootGetterContext(context);
  const { commit } = rootActionContext(context);
  try {
    const languages = await getLanguages();

    if (languages) {
      for (const language of languages) {
        if (language.icon) {
          if (!getters.getLanguageUI(language.address!)) {
            const uiData: ExpressionUIIcons = {
              languageAddress: language!.address!,
              createIcon: language!.constructorIcon!.code!,
              viewIcon: language!.icon!.code!,
              name: language!.name!,
            };
            commit.addExpressionUI(uiData);
          }
        }
      }
    }
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
