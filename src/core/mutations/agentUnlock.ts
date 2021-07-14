import { ad4mClient } from "@/app";
import { AgentStatus } from "@perspect3vism/ad4m";

//Query expression handler
export function agentUnlock(passphrase: string): Promise<AgentStatus> {
  return ad4mClient.agent.lock(passphrase)
}
