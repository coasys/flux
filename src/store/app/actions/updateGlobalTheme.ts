import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";

import { appActionContext } from "@/store/app/index";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  context: any,
  payload: ThemeState
): Promise<void> {
  const { commit: appCommit, state: appState } = appActionContext(context);
  const currentThemeIsGlobal = appState.currentTheme === "global";
  const mergedTheme = { ...appState.globalTheme, ...payload };

  if (currentThemeIsGlobal) {
    setTheme(mergedTheme);
  }

  appCommit.setGlobalTheme(mergedTheme);
}
