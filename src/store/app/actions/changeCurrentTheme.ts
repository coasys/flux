import { CurrentThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";
import { rootActionContext } from "@/store/index";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  context: any,
  payload: CurrentThemeState
): Promise<void> {
  const { commit, rootState } = rootActionContext(context);
  if (payload === "global") {
    setTheme(rootState.app.globalTheme);
    commit.setCurrentTheme("global");
  } else {
    const theme = rootState.data.communities[payload].theme;
    setTheme(theme!);
    commit.setCurrentTheme(payload);
  }
}
