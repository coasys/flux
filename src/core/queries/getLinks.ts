import { apolloClient } from "@/main";
import ad4m from "@perspect3vism/ad4m-executor";
import {
  SOURCE_PREDICATE_LINK_QUERY,
  SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED,
} from "../graphql_queries";

export async function getLinks(
  perspectiveUUID: string,
  source: string,
  predicate: string
): Promise<ad4m.LinkExpression[]> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{ links: ad4m.LinkExpression[] }>({
        query: SOURCE_PREDICATE_LINK_QUERY,
        variables: { perspectiveUUID, source, predicate },
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        resolve(result.data.links);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function getChatChannelLinks(
  perspectiveUUID: string,
  linkLanguageAddress: string
): Promise<ad4m.LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    `${linkLanguageAddress}://self`,
    "sioc://has_space"
  );
}

export async function getGroupExpressionLinks(
  perspectiveUUID: string,
  linkLanguageAddress: string
): Promise<ad4m.LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    `${linkLanguageAddress}://self`,
    "rdf://class"
  );
}

export async function getLinksPaginated(
  perspectiveUUID: string,
  source: string,
  predicate: string,
  fromDate: Date,
  untilDate: Date
): Promise<ad4m.LinkExpression[]> {
  // console.log("Getting links", fromDate, untilDate);
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{ links: ad4m.LinkExpression[] }>({
        query: SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED,
        variables: { perspectiveUUID, source, predicate, fromDate, untilDate },
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        //console.log("Got raw result", result);
        resolve(result.data.links);
      })
      .catch((error) => reject(error));
  });
}
