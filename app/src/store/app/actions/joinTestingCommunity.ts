import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { useAppStore } from "..";
import { useDataStore } from "@/store/data";

export async function joinTestingCommunity() {
  const appStore = useAppStore();
  const dataStore = useDataStore();
  try {
    await dataStore.joinCommunity({
      joiningLink: DEFAULT_TESTING_NEIGHBOURHOOD,
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
