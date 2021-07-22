import { Commit } from "vuex";
import { CurrentThemeState } from "@/store";
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
  payload: CurrentThemeState
): Promise<void> {
  if (payload === "global") {
    setTheme(state.ui.globalTheme);
    commit("setCurrentTheme", "global");
  } else {
    const theme = state.communities[payload].theme;
    setTheme(theme);
    commit("setCurrentTheme", payload);
  }
}
