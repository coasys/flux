import { apolloClient } from "@/app";
import { INITIALIZE_AGENT } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

//Query expression handler
export function initAgent(): Promise<ad4m.AgentService> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{
        initializeAgent: ad4m.AgentService;
      }>({ mutation: INITIALIZE_AGENT, variables: {} })
      .then((result) => {
        resolve(result.data!.initializeAgent);
      })
      .catch((error) => reject(error));
  });
}
