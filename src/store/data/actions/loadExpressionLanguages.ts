import { getLanguages } from "@/core/queries/getLanguages";

import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";
import { ExpressionUIIcons } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async (context: any): Promise<void> => {
  const { state: dataState, commit: dataCommit } = dataActionContext(context);
  const { commit: appCommit, state: appState, getters: appGetters } = appActionContext(context);
  const { commit: userCommit, state: userState, getters: userGetters } = userActionContext(context);
  
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
