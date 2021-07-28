import { apolloClient } from "@/utils/setupApolloClient";

import { AgentStatus } from "@perspect3vism/ad4m-types";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { AGENT_GENERATE } from "../graphql_queries";

//Query expression handler
export async function agentGenerate(passphrase: string): Promise<AgentStatus> {
  const { agentGenerate } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: AGENT_GENERATE,
      variables: { passphrase },
    })
  );
  return new AgentStatus(agentGenerate);
}
