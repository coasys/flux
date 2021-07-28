import { getLanguages } from "@/core/queries/getLanguages";

import { appActionContext } from "@/store/app/index";
import { ExpressionUIIcons } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async (context: any): Promise<void> => {
  const { commit: appCommit, getters: appGetters } = appActionContext(context);
  
  try {
    const languages = await getLanguages();

    if (languages) {
      for (const language of languages) {
        if (language.icon) {
          if (!appGetters.getLanguageUI(language.address!)) {
            const uiData: ExpressionUIIcons = {
              languageAddress: language!.address!,
              createIcon: language!.constructorIcon!.code!,
              viewIcon: language!.icon!.code!,
              name: language!.name!,
            };
            appCommit.addExpressionUI(uiData);
          }
        }
      }
    }
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
