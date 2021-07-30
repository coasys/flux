import { agentGenerate } from "@/core/mutations/agentGenerate";
import { addPerspective } from "@/core/mutations/addPerspective";

import { databasePerspectiveName } from "@/core/juntoTypes";
import { rootActionContext } from "@/store/index";

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  password: string;
  email: string;
  profilePicture: string;
  thumbnailPicture: string;
}

export default async (
  context: any,
  {
    givenName,
    familyName,
    email,
    username,
    password,
    profilePicture,
    thumbnailPicture,
  }: Payload
): Promise<void> => {
  const { commit } = rootActionContext(context);
  const perspectiveName = databasePerspectiveName;

  try {
    const status = await agentGenerate(password);
    const addPerspectiveResult = await addPerspective(perspectiveName);

    commit.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture,
    });
    commit.updateAgentStatus(status);
    commit.setDatabasePerspective(addPerspectiveResult.uuid);
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
