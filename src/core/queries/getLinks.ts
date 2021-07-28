import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { LinkQuery, LinkExpression } from "@perspect3vism/ad4m-types";
import { PERSPECTIVE_LINK_QUERY } from "../graphql_queries";

export async function getLinks(
  perspective: string,
  linkQuery: LinkQuery
): Promise<LinkExpression[]> {
  const { perspectiveQueryLinks } = unwrapApolloResult(
    await apolloClient.query({
      query: PERSPECTIVE_LINK_QUERY,
      variables: { uuid: perspective, query: linkQuery },
    })
  );
  return perspectiveQueryLinks;
}

export function getChatChannelLinks(
  perspectiveUUID: string,
  linkLanguageAddress: string
): Promise<LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    new LinkQuery({
      source: `${linkLanguageAddress}://self`,
      predicate: "sioc://has_space",
    })
  );
}

export function getGroupExpressionLinks(
  perspectiveUUID: string,
  linkLanguageAddress: string
): Promise<LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    new LinkQuery({
      source: `${linkLanguageAddress}://self`,
      predicate: "rdf://class",
    })
  );
}
