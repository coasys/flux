import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { GET_TRUSTED_AGENTS } from "../graphql_queries";

export async function getTrustedAgents(): Promise<string[]> {
  const { getTrustedAgents } = unwrapApolloResult(
    await apolloClient.query({
      query: GET_TRUSTED_AGENTS,
    })
  );
  return getTrustedAgents;
}
