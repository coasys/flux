import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { updateProfile } from "@fluxapp/api";

export interface Payload {
  username?: string;
  profilePicture?: string;
  bio?: string;
  profileBackground?: string;
}

export default async (payload: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const newProfile = await updateProfile(payload);
    userStore.setUserProfile(newProfile);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
