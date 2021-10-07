import { apolloClient } from "@/app";
import { AgentStatus } from "@perspect3vism/ad4m";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { AGENT_UNLOCK } from "../graphql_queries";

//Query expression handler
export async function agentUnlock(passphrase: string): Promise<AgentStatus> {
  const { agentUnlock } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: AGENT_UNLOCK,
      variables: { passphrase },
    })
  );
  return new AgentStatus(agentUnlock);
}
