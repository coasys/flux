import { agentUnlock } from "@/core/mutations/agentUnlock";
import { AgentStatus } from "@perspect3vism/ad4m-types";

import { rootActionContext } from "@/store/index";

export interface Payload {
  password: string;
}

export default async (
  context: any,
  { password }: Payload
): Promise<AgentStatus> => {
  const { commit } = rootActionContext(context);
  try {
    const lockRes = await agentUnlock(password);

    commit.updateAgentStatus(lockRes);
    return lockRes;
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
