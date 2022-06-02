import { ad4mClient } from "@/app";
import { useAppStore } from "@/store/app";
import { AgentStatus } from "@perspect3vism/ad4m";
import { useUserStore } from "..";

export interface Payload {
  password: string;
}

export default async ({ password }: Payload): Promise<AgentStatus> => {
  const userStore = useUserStore();
  const appStore = useAppStore();
  try {
    const lockRes = await ad4mClient.agent.unlock(password);

    userStore.updateAgentStatus(lockRes);
    return lockRes;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
