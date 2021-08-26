import { getLanguages } from "@/core/queries/getLanguages";
import { useAppStore } from "@/store/app";

import { ExpressionUIIcons } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async (): Promise<void> => {
  const appStore = useAppStore();

  try {
    const languages = await getLanguages();

    if (languages) {
      for (const language of languages) {
        if (language.icon) {
          if (!appStore.getLanguageUI(language.address!)) {
            const uiData: ExpressionUIIcons = {
              languageAddress: language!.address!,
              createIcon: language!.constructorIcon!.code!,
              viewIcon: language!.icon!.code!,
              name: language!.name!,
            };
            appStore.addExpressionUI(uiData);
          }
        }
      }
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
