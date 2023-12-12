import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { useAppStore } from "..";
import { joinCommunity } from "@coasys/flux-api";

export async function joinTestingCommunity() {
  const appStore = useAppStore();
  try {
    await joinCommunity({ joiningLink: DEFAULT_TESTING_NEIGHBOURHOOD });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
