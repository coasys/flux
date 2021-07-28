import { agentGenerate } from "@/core/mutations/agentGenerate";
import { addPerspective } from "@/core/mutations/addPerspective";

import { databasePerspectiveName } from "@/core/juntoTypes";
import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";

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
  const { state: dataState, commit: dataCommit } = dataActionContext(context);
  const { commit: appCommit, state: appState, getters: appGetters } = appActionContext(context);
  const { commit: userCommit, state: userState, getters: userGetters } = userActionContext(context);
  
  const perspectiveName = databasePerspectiveName;

  try {
    const status = await agentGenerate(password);
    const addPerspectiveResult = await addPerspective(perspectiveName);

    userCommit.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture,
    });
    userCommit.updateAgentStatus(status);
    appCommit.setDatabasePerspective(addPerspectiveResult.uuid);
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
