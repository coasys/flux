import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { LanguageRef } from "@perspect3vism/ad4m";
import { ADD_TRUSTED_AGENTS } from "../graphql_queries";

export async function addTrustedAgents(agents: string[]): Promise<LanguageRef> {
  const { addTrustedAgents } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: ADD_TRUSTED_AGENTS,
      variables: { agents },
    })
  );

  return addTrustedAgents;
}
