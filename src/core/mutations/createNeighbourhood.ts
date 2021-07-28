import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { Perspective } from "@perspect3vism/ad4m-types";
import { PUBLISH_NEIGHBOURHOOD_FROM_PERSPECTIVE } from "../graphql_queries";

export async function createNeighbourhood(
  perspective: string,
  linkLanguage: string,
  meta: Perspective
): Promise<string> {
  const { neighbourhoodPublishFromPerspective } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: PUBLISH_NEIGHBOURHOOD_FROM_PERSPECTIVE,
      variables: { perspectiveUUID: perspective, linkLanguage, meta: meta },
    })
  );
  return neighbourhoodPublishFromPerspective;
}
