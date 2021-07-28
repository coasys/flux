import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { Perspective } from "@perspect3vism/ad4m-types";
import { PERSPECTIVE_SNAPSHOT } from "../graphql_queries";

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
