import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { ADD_LINK } from "../graphql_queries";
import type { Link, LinkExpression } from "@perspect3vism/ad4m";

export async function createLink(
  perspective: string,
  link: Link
): Promise<LinkExpression> {
  const { perspectiveAddLink } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: ADD_LINK,
      variables: { uuid: perspective, link },
    })
  );
  return perspectiveAddLink;
}
