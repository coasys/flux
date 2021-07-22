import { Commit } from "vuex";
import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";

export interface Context {
  commit: Commit;
  getters: any;
  state: any;
}

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  { commit, state }: Context,
  payload: { communityId: string; theme: ThemeState }
): Promise<void> {
  const isCurrentTheme = state.ui.currentTheme === payload.communityId;
  const mergedTheme = {
    ...state.communities[payload.communityId].theme,
    ...payload.theme,
  };

  if (isCurrentTheme) {
    setTheme(mergedTheme);
  }

  commit("setCommunityTheme", {
    communityId: payload.communityId,
    theme: mergedTheme,
  });
}
