import { Commit } from "vuex";
import ad4m from "@perspect3vism/ad4m-executor";
import { apolloClient } from "@/main";

import {
  INITIALIZE_AGENT,
  LOCK_AGENT,
  ADD_PERSPECTIVE,
} from "../../core/graphql_queries";

import { databasePerspectiveName } from "@/core/juntoTypes";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  password: string;
  email: string;
}

export default async (
  { commit, getters }: Context,
  { givenName, familyName, email, username, password }: Payload
): Promise<void> => {
  let error = false;
  const perspectiveName = databasePerspectiveName;

  try {
    await apolloClient.mutate<{
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
      address: addPerspectiveResult.data?.addPerspective.uuid || "",
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
    });
  } catch (e) {
    error = true;
    console.warn(e);
  }

  return new Promise((resolve, reject) => {
    if (error) reject();
    else resolve();
  });
};
