import { COMMUNITY_TEST_VERSION, DEFAULT_TESTING_NEIGHBOURHOOD } from "utils/constants/general";
import {
  getAd4mClient
} from "@perspect3vism/ad4m-connect/dist/utils";
import { useAppStore } from "..";
import joinCommunity from "utils/api/joinCommunity";

export async function joinTestingCommunity() {
    const store = useAppStore();
    try {
        await joinCommunity({joiningLink: DEFAULT_TESTING_NEIGHBOURHOOD});
        store.setHasSeenTestCommunity(COMMUNITY_TEST_VERSION);
        //Stop showing the disclaimer
        store.setShowDisclaimer(false);
        //And dont show the warning disclaimer, since if it is present, clicking join on this modal is the same as clicking close
        store.setShowWarningDisclaimer(false);
    } catch (e) {
        //Stop showing the disclaimer
        store.setShowDisclaimer(false);
        //And dont show the warning disclaimer, since if it is present, clicking join on this modal is the same as clicking close
        store.setShowWarningDisclaimer(false);
    }
}