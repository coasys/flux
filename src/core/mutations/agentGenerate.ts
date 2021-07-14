import { apolloClient, ad4mClient } from "@/app";
import { AgentStatus } from "@perspect3vism/ad4m";

//Query expression handler
export function agentGenerate(passphrase: string): Promise<AgentStatus> {
  return ad4mClient.agent.generate(passphrase)
}
