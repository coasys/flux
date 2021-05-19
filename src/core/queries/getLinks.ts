import { apolloClient } from "@/main";
import ad4m from "@perspect3vism/ad4m-executor";
import { SOURCE_PREDICATE_LINK_QUERY } from "../graphql_queries";

export async function getLinks(
  perspectiveUUID: string,
  source: string,
  predicate: string
): Promise<ad4m.LinkExpression[]> {
  return new Promise((resolve) => {
    const getLinksQ = apolloClient.query<{ links: ad4m.LinkExpression[] }>({
      query: SOURCE_PREDICATE_LINK_QUERY,
      variables: { perspectiveUUID, source, predicate },
    });
    getLinksQ.then((result) => {
      resolve(result.data.links);
    });
  });
}
