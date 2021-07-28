import { CurrentThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";
import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  context: any,
  payload: CurrentThemeState
): Promise<void> {
  const { state: dataState } = dataActionContext(context);
  const { commit: appCommit, state: appState } = appActionContext(context);
  if (payload === "global") {
    setTheme(appState.globalTheme);
    appCommit.setCurrentTheme("global");
  } else {
    const theme = dataState.communities[payload].theme;
    setTheme(theme!);
    appCommit.setCurrentTheme(payload);
  }
}
