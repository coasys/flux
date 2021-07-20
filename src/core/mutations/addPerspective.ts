import { apolloClient } from "@/app";
import type { PerspectiveHandle } from "@perspect3vism/ad4m-types";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { PERSPECTIVE_ADD } from "../graphql_queries";

export async function addPerspective(name: string): Promise<PerspectiveHandle> {
  const { perspectiveAdd } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: PERSPECTIVE_ADD,
      variables: { name },
    })
  );
  return perspectiveAdd;
}
