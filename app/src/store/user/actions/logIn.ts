import { useAppStore } from "@/store/app";
import { AgentStatus } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { useUserStore } from "..";

export interface Payload {
  password: string;
}

export default async ({ password }: Payload): Promise<AgentStatus> => {
  const userStore = useUserStore();
  const appStore = useAppStore();
  const client = await getAd4mClient();

  try {
    const lockRes = await client.agent.unlock(password);

    userStore.updateAgentStatus(lockRes);
    return lockRes;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
