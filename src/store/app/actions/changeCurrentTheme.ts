import { CurrentThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";
import { useAppStore } from "@/store/app/index";
import { useDataStore } from "@/store/data";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateGlobalTheme(
  payload: CurrentThemeState
): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  if (payload === "global") {
    setTheme(appStore.globalTheme);
    appStore.setCurrentTheme("global");
  } else {
    const theme = dataStore.getCommunity(payload).state.theme;
    setTheme(theme!);
    appStore.setCurrentTheme(payload);
  }
}
