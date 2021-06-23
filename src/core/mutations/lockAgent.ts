import { apolloClient } from "@/main";
import { LOCK_AGENT } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

//Query expression handler
export function lockAgent(password: string): Promise<ad4m.AgentService> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{
        lockAgent: ad4m.AgentService;
        passphrase: string;
      }>({
        mutation: LOCK_AGENT,
        variables: {
          passphrase: password,
        },
      })
      .then((result) => {
        resolve(result.data!.lockAgent);
      })
      .catch((error) => reject(error));
  });
}
