import { Commit } from "vuex";
import ad4m from "@perspect3vism/ad4m-executor";
import { apolloClient } from "@/app";
import { UNLOCK_AGENT } from "@/core/graphql_queries";
import { unlockAgent } from "@/core/mutations/unlockAgent";

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
    const lockRes = await unlockAgent(password);

    commit("updateAgentInitState", lockRes.isInitialized!);
    commit("updateAgentLockState", lockRes.isUnlocked!);
    return lockRes;
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
