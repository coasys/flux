import { Commit } from "vuex";
import hash from "object-hash";
import { print } from "graphql/language/printer";
import {
  SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED,
  QUERY_EXPRESSION,
} from "@/core/graphql_queries";
import { State } from "..";
export interface Context {
  commit: Commit;
  getters: any;
  state: State;
}

export interface Payload {
  communityId: string;
  channelId: string;
  from: Date;
  to: Date;
}

export interface LoadExpressionResult {
  linksWorker: any;
}

/// Function that polls for new messages on a channel using a web worker, if a message link is found then another web worker is spawned to retry getting the expression until its found
export default async function (
  { getters, commit, state }: Context,
  { channelId, communityId, from, to }: Payload
): Promise<LoadExpressionResult> {
  try {
    const fromDate = from || getters.getApplicationStartTime;
    const untilDate = to || new Date("August 19, 1975 23:15:30").toISOString();

    const community = state.communities[communityId];
    const channel = community?.channels[channelId];
    let latestLinkTimestamp: Date | null = null;

    const linksWorker = new Worker("pollingWorker.js");

    linksWorker.postMessage({
      interval: 10000,
      query: print(SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED),
      variables: {
        perspectiveUUID: channelId.toString(),
        source: "sioc://chatchannel",
        predicate: "sioc://content_of",
        fromDate,
        untilDate,
      },
      name: `Get channel messages ${channel.name}`,
    });

    //If links worker gets an error then throw it
    linksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    //Listen for message callback saying we got some links
    linksWorker.addEventListener("message", async (e) => {
      const linkQuery = e.data.links;
      if (linkQuery) {
        if (channel) {
          for (const link of linkQuery) {
            //Hash the link data as the key for map and check if it exists in the store
            const currentExpressionLink =
              channel.currentExpressionLinks[
                hash(link.data!, { excludeValues: "__typename" })
              ];

            if (!currentExpressionLink) {
              const expressionWorker = new Worker("pollingWorker.js");

              //Run expression worker to try and get expression on link target
              expressionWorker.postMessage({
                retry: 50,
                interval: 5000,
                query: print(QUERY_EXPRESSION),
                variables: { url: link.data.target },
                name: "Get expression data from channel links",
              });

              expressionWorker.onerror = function (e) {
                throw new Error(e.toString());
              };

              expressionWorker.addEventListener("message", (e) => {
                const expression = e.data.expression;
                //Check an expression was actually found as not null
                if (expression) {
                  //Expression not null so kill the worker to stop future polling
                  expressionWorker.terminate();
                  //Add the link and message to the store
                  commit("addMessage", {
                    channelId,
                    communityId,
                    link: link,
                    expression: expression,
                    linkLanguage: channel.linkLanguageAddress,
                  });

                  //Compare the timestamp of this link with the current highest
                  const linkTimestamp = new Date(link.timestamp!);
                  if (latestLinkTimestamp) {
                    if (linkTimestamp > latestLinkTimestamp!) {
                      latestLinkTimestamp = linkTimestamp;
                    }
                  } else {
                    latestLinkTimestamp = linkTimestamp;
                  }
                }
              });
            }
          }

          //If we have a linktimestamp check if timestamp is > than current latest link to allow for dynamic scroll rendering
          if (latestLinkTimestamp) {
            if (
              Object.values(channel.currentExpressionLinks).filter(
                (link) =>
                  new Date(link.expression.timestamp!) > latestLinkTimestamp!
              ).length > 0
            ) {
              return [false, linksWorker];
            } else {
              return [true, linksWorker];
            }
          }
        }
      }
    });

    return { linksWorker };
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
}
