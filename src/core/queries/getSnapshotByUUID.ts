import { apolloClient } from "@/app";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { LanguageHandle, Perspective } from "@perspect3vism/ad4m";
import { LANGUAGE, SNAPSHOT_BY_UUID } from "../graphql_queries";

export default async function getSnapshotByUUID(
  uuid: string
): Promise<Perspective | null> {
  const { perspectiveSnapshot } = unwrapApolloResult(
    await apolloClient.query({
      query: SNAPSHOT_BY_UUID,
      variables: { uuid },
      fetchPolicy: "no-cache",
    })
  );
  return perspectiveSnapshot;
}
