import { Commit } from "vuex";
import ad4m from "@perspect3vism/ad4m-executor";
import { apolloClient } from "@/main";

import {
  INITIALIZE_AGENT,
  LOCK_AGENT,
  ADD_PERSPECTIVE,
} from "@/core/graphql_queries";

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
    const status = await apolloClient.mutate<{
      initializeAgent: ad4m.AgentService;
    }>({ mutation: INITIALIZE_AGENT, variables: {} });

    await apolloClient.mutate<{
      lockAgent: ad4m.AgentService;
      passphrase: string;
    }>({
      mutation: LOCK_AGENT,
      variables: {
        passphrase: password,
      },
    });

    const addPerspectiveResult = await apolloClient.mutate<{
      addPerspective: ad4m.Perspective;
    }>({
      mutation: ADD_PERSPECTIVE,
      variables: {
        name: perspectiveName,
      },
    });

    commit(
      "addDatabasePerspective",
      addPerspectiveResult.data?.addPerspective.uuid
    );

    commit("createProfile", {
      address: status.data!.initializeAgent.did!,
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture,
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
