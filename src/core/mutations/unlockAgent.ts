import { apolloClient } from "@/app";
import { LOCK_AGENT, UNLOCK_AGENT } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

//Query expression handler
export function unlockAgent(password: string): Promise<ad4m.AgentService> {
  return new Promise((resolve, reject) => {
    apolloClient.mutate<{
      unlockAgent: ad4m.AgentService;
      passphrase: string;
    }>({
      mutation: UNLOCK_AGENT,
      variables: { passphrase: password },
    })
      .then((result) => {
        resolve(result.data!.unlockAgent);
      })
      .catch((error) => reject(error));
  });
}
