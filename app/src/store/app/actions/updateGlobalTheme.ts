import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";
import { useAppStore } from "..";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  payload: ThemeState
): Promise<void> {
  const store = useAppStore();
  const currentThemeIsGlobal = store.currentTheme === "global";
  const mergedTheme = { ...store.globalTheme, ...payload };

  if (currentThemeIsGlobal) {
    setTheme(mergedTheme);
  }

  store.setGlobalTheme(mergedTheme);
}
