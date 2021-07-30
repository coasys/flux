import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";

import { rootActionContext } from "@/store/index";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  context: any,
  payload: ThemeState
): Promise<void> {
  const { commit, rootState } = rootActionContext(context);
  const currentThemeIsGlobal = rootState.app.currentTheme === "global";
  const mergedTheme = { ...rootState.app.globalTheme, ...payload };

  if (currentThemeIsGlobal) {
    setTheme(mergedTheme);
  }

  commit.setGlobalTheme(mergedTheme);
}
