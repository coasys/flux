import { Commit } from "vuex";
import { useMutation } from "@vue/apollo-composable";
import ad4m from "@perspect3vism/ad4m-executor";

import { UNLOCK_AGENT } from "../../core/graphql_queries";

export interface Context {
  commit: Commit;
}

export interface Payload {
  password: string;
}

export default async (
  { commit }: Context,
  { password }: Payload
): Promise<void> => {
  const { mutate: unlockDidStore, error: unlockDidStoreError } = useMutation<{
    unlockAgent: ad4m.AgentService;
    passphrase: string;
  }>(UNLOCK_AGENT, () => ({
    variables: { passphrase: password },
  }));

  console.log("WelcomeViewRight: unlockDidStore() called");
  const res = unlockDidStore();
  res.then((val) => {
    console.log("Unlock result", val);
    if (
      unlockDidStoreError == null &&
      val.data?.unlockAgent.isInitialized &&
      val.data.unlockAgent.isUnlocked
    ) {
      commit("updateAgentInitState", true);
      commit("updateAgentLockState", true);
    } else {
      //TODO: this needs to go to an error handler function
      console.log("Got error", unlockDidStoreError);
    }
  });
};
