import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";

import { appActionContext } from "@/store/app/index";
import { dataActionContext } from "@/store/data/index";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  context: any,
  payload: { communityId: string; theme: ThemeState }
): Promise<void> {
  const { commit: dataCommit, state: dataState } = dataActionContext(context);
  const { state: appState } = appActionContext(context);
  const isCurrentTheme = appState.currentTheme === payload.communityId;
  const mergedTheme = {
    ...dataState.communities[payload.communityId].theme,
    ...payload.theme,
  };

  if (isCurrentTheme) {
    setTheme(mergedTheme);
  }

  dataCommit.setCommunityTheme({
    communityId: payload.communityId,
    theme: mergedTheme,
  });
}
