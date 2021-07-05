import { Commit } from "vuex";
import ad4m from "@perspect3vism/ad4m-executor";
import { apolloClient } from "@/app";
import { UNLOCK_AGENT } from "@/core/graphql_queries";

export interface Context {
  commit: Commit;
}

export interface Payload {
  password: string;
}

export default async (
  { commit }: Context,
  { password }: Payload
): Promise<any> => {
  try {
    const lockRes = await apolloClient.mutate<{
      unlockAgent: ad4m.AgentService;
      passphrase: string;
    }>({
      mutation: UNLOCK_AGENT,
      variables: { passphrase: password },
    });
    commit("updateAgentInitState", lockRes.data!.unlockAgent.isInitialized!);
    commit("updateAgentLockState", lockRes.data!.unlockAgent.isUnlocked!);
    return lockRes;
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
