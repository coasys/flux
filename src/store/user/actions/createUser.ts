import { agentGenerate } from "@/core/mutations/agentGenerate";

import { useAppStore } from "@/store/app";
import { useUserStore } from "..";

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  password: string;
  email: string;
  profilePicture?: string;
  thumbnailPicture?: string;
}

export default async ({
  givenName,
  familyName,
  email,
  username,
  password,
  profilePicture,
  thumbnailPicture,
}: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const status = await agentGenerate(password);

    userStore.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture,
    });
    userStore.updateAgentStatus(status);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
