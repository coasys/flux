import { ThemeState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";

import { useAppStore } from "..";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function updateCommunityTheme(payload: {
  communityId: string;
  theme: ThemeState;
}): Promise<void> {
  const appStore = useAppStore();
  const isCurrentTheme = appStore.currentTheme === payload.communityId;
  const mergedTheme = {
    // TODO: Merge community theme
    ...payload.theme,
  };

  if (isCurrentTheme) {
    setTheme(mergedTheme);
  }

  // TODO: Update community theme
}
