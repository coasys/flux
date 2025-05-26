import { Theme } from "@/stores/types";
import { setTheme } from "@/utils/themeHelper";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useThemeStore = defineStore("themeStore", () => {
  const globalTheme = ref<Theme>({ fontSize: "md", fontFamily: "DM Sans", name: "dark", hue: 270, saturation: 60 });
  const currentTheme = ref("global");

  // Mutations
  function setCurrentTheme(payload: string): void {
    currentTheme.value = payload;
  }

  function setGlobalTheme(payload: Theme): void {
    globalTheme.value = { ...globalTheme.value, ...payload };
  }

  // Actions
  async function changeCurrentTheme(payload: string): Promise<void> {
    if (payload === "global") {
      setTheme(globalTheme.value);
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
    if (currentTheme.value === communityId) setTheme(mergedTheme);
    // Todo: Update community theme
  }

  async function updateGlobalTheme(payload: Partial<Theme>): Promise<void> {
    const mergedTheme = { ...globalTheme.value, ...payload };
    if (currentTheme.value === "global") setTheme(mergedTheme);
    setGlobalTheme(mergedTheme);
  }

  return {
    // State
    globalTheme,
    currentTheme,

    // Mutations
    setCurrentTheme,
    setGlobalTheme,

    // Actions
    changeCurrentTheme,
    updateCommunityTheme,
    updateGlobalTheme,
  };
});
