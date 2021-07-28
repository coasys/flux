import { agentUnlock } from "@/core/mutations/agentUnlock";
import { AgentStatus } from "@perspect3vism/ad4m-types";

import { userActionContext } from "../index";
import { appActionContext } from "@/store/app/index";

export interface Payload {
  password: string;
}

export default async (
  context: any,
  { password }: Payload
): Promise<AgentStatus> => {
  const { commit: userCommit } = userActionContext(context);
  const { commit: appCommit } = appActionContext(context);
  try {
    const lockRes = await agentUnlock(password);

    userCommit.updateAgentStatus(lockRes);
    return lockRes;
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
