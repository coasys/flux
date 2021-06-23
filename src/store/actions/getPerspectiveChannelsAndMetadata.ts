import { Commit } from "vuex";
import { CommunityState, ChannelState } from "@/store";
import { print } from "graphql/language/printer";
import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import { expressionGetRetries, expressionGetDelayMs } from "@/core/juntoTypes";
import {
  SOURCE_PREDICATE_LINK_QUERY,
  QUERY_EXPRESSION,
} from "@/core/graphql_queries";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  communityId: string;
}

export default async (
  { commit, getters }: Context,
  { communityId }: Payload
): Promise<[Worker, Worker]> => {
  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community: CommunityState = getters.getCommunity(communityId);
    console.log("Getting community channel links for community: ", communityId);
    const channelLinksWorker = new Worker("pollingWorker.js");

    channelLinksWorker.postMessage({
      interval: 5000,
      query: print(SOURCE_PREDICATE_LINK_QUERY),
      variables: {
        perspectiveUUID: community.perspective,
        source: `${community.linkLanguageAddress}://self`,
        predicate: "sioc://has_space",
      },
    });

    channelLinksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    channelLinksWorker.addEventListener("message", async (e) => {
      try {
        const channelLinks = e.data.links;

        if (channelLinks) {
          for (let i = 0; i < channelLinks.length; i++) {
            if (
              Object.values(community.channels).find(
                (element: ChannelState) =>
                  element.sharedPerspectiveUrl === channelLinks[i].data!.target
              ) == undefined
            ) {
              // console.log(
              //   "Found channel link",
              //   channelLinks[i],
              //   "Adding to channel"
              // );
              const channel = await joinChannelFromSharedLink(
                channelLinks[i].data!.target!
              );
              //console.log("trying to join channel", channel, community.perspective);
              commit("addChannel", {
                communityId: community.perspective,
                channel: channel,
              });
            }
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    });

    const groupExpressionWorker = new Worker("pollingWorker.js");

    groupExpressionWorker.postMessage({
      interval: 5000,
      query: print(SOURCE_PREDICATE_LINK_QUERY),
      variables: {
        perspectiveUUID: community.perspective,
        source: `${community.linkLanguageAddress}://self`,
        predicate: "rdf://class",
      },
    });

    groupExpressionWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    groupExpressionWorker.addEventListener("message", async (e) => {
      try {
        const groupExpressionLinks = e.data.links;
        //console.log("Got group expression links", groupExpressionLinks);
        if (groupExpressionLinks != null && groupExpressionLinks.length > 0) {
          if (
            community.groupExpressionRef !=
            groupExpressionLinks[groupExpressionLinks.length - 1].data!.target!
          ) {
            const expressionWorker = new Worker("pollingWorker.js");

            expressionWorker.postMessage({
              retry: expressionGetRetries,
              quitOnResponse: true,
              interval: expressionGetDelayMs,
              query: print(QUERY_EXPRESSION),
              variables: {
                url: groupExpressionLinks[groupExpressionLinks.length - 1].data!
                  .target!,
              },
            });

            expressionWorker.onerror = function (e) {
              throw new Error(e.toString());
            };

            expressionWorker.addEventListener("message", (e) => {
              const getExpRes = e.data.expression;
              if (getExpRes) {
                const groupExpData = JSON.parse(getExpRes.data!);
                console.log(
                  "Got new group expression data for community",
                  groupExpData
                );
                commit("updateCommunityMetadata", {
                  communityId: community.perspective,
                  name: groupExpData["name"],
                  description: groupExpData["description"],
                  groupExpressionRef:
                    groupExpressionLinks[groupExpressionLinks.length - 1].data!
                      .target,
                });
              }
            });
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    });
    return [channelLinksWorker, groupExpressionWorker]
  } catch (e) {
    throw new Error(e);
  }
};
