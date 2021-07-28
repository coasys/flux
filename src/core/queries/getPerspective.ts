import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { Perspective, PerspectiveHandle } from "@perspect3vism/ad4m-types";
import { PERSPECTIVE, PERSPECTIVE_SNAPSHOT } from "../graphql_queries";

export async function getPerspective(
  uuid: string
): Promise<PerspectiveHandle | null> {
  const { perspective } = unwrapApolloResult(
    await apolloClient.query({
      query: PERSPECTIVE,
      variables: { uuid },
    })
  );
  return perspective;
}

export async function getPerspectiveSnapshot(
  uuid: string
): Promise<Perspective | null> {
  const { perspectiveSnapshot } = unwrapApolloResult(
    await apolloClient.query({
      query: PERSPECTIVE_SNAPSHOT,
      variables: { uuid },
    })
  );
  return perspectiveSnapshot;
}
