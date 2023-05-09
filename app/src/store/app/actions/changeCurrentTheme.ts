import { setTheme } from "@/utils/themeHelper";
import { useAppStore } from "@/store/app/index";

export default async function updateGlobalTheme(
  payload: "global" | string
): Promise<void> {
  const appStore = useAppStore();
  if (payload === "global") {
    setTheme(appStore.globalTheme);
    appStore.setCurrentTheme("global");
  } else {
    // TODO: Get local theme
    // const theme = dataStore.getLocalCommunityState(payload).theme;
    // setTheme(theme!);
    // appStore.setCurrentTheme(payload);
  }
}
