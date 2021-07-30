import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { NEIGHBOURHOOD_JOIN } from "../graphql_queries";

export async function joinNeighbourhood(
  url: string
): Promise<PerspectiveHandle> {
  const { neighbourhoodJoinFromUrl } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: NEIGHBOURHOOD_JOIN,
      variables: { url },
    })
  );
  return neighbourhoodJoinFromUrl;
}
