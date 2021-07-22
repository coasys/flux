import { Commit } from "vuex";
import { agentUnlock } from "@/core/mutations/agentUnlock";

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
    const lockRes = await agentUnlock(password);

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
