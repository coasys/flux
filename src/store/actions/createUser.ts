import { Commit } from "vuex";
import { agentGenerate } from "@/core/mutations/agentGenerate";
import { addPerspective } from "@/core/mutations/addPerspective";

import { databasePerspectiveName } from "@/core/juntoTypes";

export interface Context {
  commit: Commit;
}

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
  { commit }: Context,
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
  const perspectiveName = databasePerspectiveName;

  try {
    const status = await agentGenerate(password);

    const addPerspectiveResult = await addPerspective(perspectiveName);

    commit("addDatabasePerspective", addPerspectiveResult.uuid);

    commit("createProfile", {
      profile: {
        username: username,
        email: email,
        givenName: givenName,
        familyName: familyName,
        profilePicture,
        thumbnailPicture,
      },
      did: status.did!,
    });

    commit("updateAgentInitState", true);
    commit("updateAgentLockState", true);
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
