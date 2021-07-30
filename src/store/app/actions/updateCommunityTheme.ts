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
  payload: { communityId: string; theme: ThemeState }
): Promise<void> {
  const { commit, rootState } = rootActionContext(context);
  const isCurrentTheme = rootState.app.currentTheme === payload.communityId;
  const mergedTheme = {
    ...rootState.data.communities[payload.communityId].theme,
    ...payload.theme,
  };

  if (isCurrentTheme) {
    setTheme(mergedTheme);
  }

  commit.setCommunityTheme({
    communityId: payload.communityId,
    theme: mergedTheme,
  });
}
