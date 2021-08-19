import { useDataStore } from "@/store/data";
import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";

import { useAppStore } from "..";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateCommunityTheme(
  payload: { communityId: string; theme: ThemeState }
): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const isCurrentTheme = appStore.currentTheme === payload.communityId;
  const mergedTheme = {
    ...dataStore.getCommunity(payload.communityId).state.theme,
    ...payload.theme,
  };

  if (isCurrentTheme) {
    setTheme(mergedTheme);
  }

  dataStore.setCommunityTheme({
    communityId: payload.communityId,
    theme: mergedTheme,
  });
}
