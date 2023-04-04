import { useAppStore } from "@/store/app";
import { useDataStore } from "../../data";
import { removeFriend } from "utils/api/friends";
import { useUserStore } from "..";

export interface Payload {
  did: string;
}

export default async (payload: Payload): Promise<any> => {
  const dataStore = useDataStore();
  const userStore = useUserStore();
  const appStore = useAppStore();

  try {
    await removeFriend(payload.did);

    const filteredFriends = userStore.friends.filter(
      (did) => did !== payload.did
    );

    userStore.setFriends(filteredFriends);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
