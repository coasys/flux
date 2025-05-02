import { Theme, ThemeStore } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";
import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";

export const useThemeStore = defineStore("theme", () => {
  const state = reactive<ThemeStore>({
    globalTheme: { fontSize: "md", fontFamily: "DM Sans", name: "dark", hue: 270, saturation: 60 },
    currentTheme: "global",
  });

  // Mutations
  function setCurrentTheme(payload: string): void {
    state.currentTheme = payload;
  }

  function setGlobalTheme(payload: Theme): void {
    state.globalTheme = { ...state.globalTheme, ...payload };
  }

  // Actions
  async function changeCurrentTheme(payload: string): Promise<void> {
    if (payload === "global") {
      setTheme(state.globalTheme);
      setCurrentTheme("global");
    } else {
      // Todo: Get local theme
      // const theme = dataStore.getLocalCommunityState(payload).theme;
      // setTheme(theme!);
      // setCurrentTheme(payload);
    }
  }

  async function updateCommunityTheme(payload: { communityId: string; theme: Theme }): Promise<void> {
    const { communityId, theme } = payload;
    // Todo: Merge community theme
    const mergedTheme = { ...theme };
    if (state.currentTheme === communityId) setTheme(mergedTheme);
    // Todo: Update community theme
  }

  async function updateGlobalTheme(payload: Theme): Promise<void> {
    const mergedTheme = { ...state.globalTheme, ...payload };
    if (state.currentTheme === "global") setTheme(mergedTheme);
    setGlobalTheme(mergedTheme);
  }

  return {
    // State
    ...toRefs(state),

    // Mutations
    setCurrentTheme,
    setGlobalTheme,

    // Actions
    changeCurrentTheme,
    updateCommunityTheme,
    updateGlobalTheme,
  };
});
