import { useAppStore } from "@/store/app";
import { useDataStore } from "../../data";
import { addFriend } from "utils/api/friends";
import { useUserStore } from "..";

export interface Payload {
  did: string;
}

export default async (payload: Payload): Promise<any> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    await addFriend(payload.did);

    const newFriends = userStore.friends.includes(payload.did)
      ? userStore.friends
      : [...userStore.friends, payload.did];

    userStore.setFriends(newFriends);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
