import { useAppStore } from "@/store/app";
import { useDataStore } from "../../data";
import { getFriends } from "utils/api/friends";
import { useUserStore } from "..";

export default async (): Promise<any> => {
  const userStore = useUserStore();
  const appStore = useAppStore();

  try {
    const friends = await getFriends();
    userStore.setFriends(friends);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
