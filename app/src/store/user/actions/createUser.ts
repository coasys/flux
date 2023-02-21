import { useAppStore } from "@/store/app";
import createProfile from "utils/api/createProfile";
import { Ad4mClient } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";
import { useUserStore } from "..";

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  email: string;
  profilePicture?: string;
  profileThumbnailPicture?: string;
}

export default async ({
  givenName = "",
  familyName = "",
  email = "",
  username,
  profilePicture,
}: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();
  const client: Ad4mClient = await getAd4mClient();

  try {
    const profile = await createProfile({
      givenName,
      familyName,
      email,
      username,
      profilePicture,
    });

    userStore.setUserProfile(profile);

    const status = await client.agent.status();

    userStore.updateAgentStatus(status);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
