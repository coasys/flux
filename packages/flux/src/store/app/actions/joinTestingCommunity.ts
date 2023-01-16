import {
  COMMUNITY_TEST_VERSION,
  DEFAULT_TESTING_NEIGHBOURHOOD,
} from "utils/constants/general";
import { useAppStore } from "..";
import { useDataStore } from "@/store/data";

export async function joinTestingCommunity() {
  const appStore = useAppStore();
  const dataStore = useDataStore();
  try {
    await dataStore.joinCommunity({
      joiningLink: DEFAULT_TESTING_NEIGHBOURHOOD,
    });
    appStore.setHasSeenTestCommunity(COMMUNITY_TEST_VERSION);
    //Stop showing the disclaimer
    appStore.setShowDisclaimer(false);
  } catch (e) {
    //Stop showing the disclaimer
    appStore.setShowDisclaimer(false);
  }
}
