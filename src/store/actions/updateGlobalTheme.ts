import { Commit } from "vuex";
import { ThemeState } from "@/store";
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
  payload: ThemeState
): Promise<void> {
  const currentThemeIsGlobal = state.ui.currentTheme === "global";
  const mergedTheme = { ...state.ui.globalTheme, ...payload };

  if (currentThemeIsGlobal) {
    setTheme(mergedTheme);
  }

  commit("setGlobalTheme", mergedTheme);
}
