import { apolloClient } from "@/app";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { LinkQuery, LinkExpression } from "@perspect3vism/ad4m";
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
  neighbourhoodUrl: string
): Promise<LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    new LinkQuery({
      source: neighbourhoodUrl,
      predicate: "sioc://has_space",
    })
  );
}

export function getGroupExpressionLinks(
  perspectiveUUID: string,
  neighbourhoodUrl: string
): Promise<LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    new LinkQuery({
      source: neighbourhoodUrl,
      predicate: "rdf://class",
    })
  );
}
