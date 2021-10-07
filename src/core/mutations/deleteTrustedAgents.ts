import { apolloClient } from "@/app";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { LanguageRef } from "@perspect3vism/ad4m";
import { DELETE_TRUSTED_AGENTS } from "../graphql_queries";

export async function deleteTrustedAgents(
  agents: string[]
): Promise<LanguageRef> {
  const { deleteTrustedAgents } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: DELETE_TRUSTED_AGENTS,
      variables: { agents },
    })
  );

  return deleteTrustedAgents;
}
