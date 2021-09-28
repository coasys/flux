import { agentGenerate } from "@/core/mutations/agentGenerate";
import { addPerspective } from "@/core/mutations/addPerspective";

import { databasePerspectiveName } from "@/core/juntoTypes";
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

  const perspectiveName = databasePerspectiveName;

  try {
    const status = await agentGenerate(password);
    const addPerspectiveResult = await addPerspective(perspectiveName);

    userStore.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture,
    });
    userStore.updateAgentStatus(status);
    appStore.setDatabasePerspective(addPerspectiveResult.uuid);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
