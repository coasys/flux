import { Commit } from "vuex";
import { CommunityState, ChannelState } from "@/store";

import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import {
  getExpression,
  getExpressionAndRetry,
} from "@/core/queries/getExpression";
import {
  getChatChannelLinks,
  getGroupExpressionLinks,
} from "@/core/queries/getLinks";
import sleep from "@/utils/sleep";
import { expressionGetRetries, expressionGetDelayMs } from "@/core/juntoTypes";

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
): Promise<any> => {
  const community = getters.getCommunity(communityId);

  try {
    console.log("Getting channel links");
    const channelLinks = await getChatChannelLinks(
      community.perspective,
      community.linkLanguageAddress
    );
    //console.log("Got links channel links", channelLinks);
    if (channelLinks != null) {
      for (let i = 0; i < channelLinks.length; i++) {
        if (
          community.channels.find(
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
      console.log("Getting group expression links");
      //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
      const groupExpressionLinks = await getGroupExpressionLinks(
        community.perspective,
        community.linkLanguageAddress
      );
      //console.log("Got group expression links", groupExpressionLinks);
      if (groupExpressionLinks != null && groupExpressionLinks.length > 0) {
        if (
          community.groupExpressionRef !=
          groupExpressionLinks[groupExpressionLinks.length - 1].data!.target!
        ) {
          const getExpRes = await getExpressionAndRetry(
            groupExpressionLinks[groupExpressionLinks.length - 1].data!.target!,
            expressionGetRetries,
            expressionGetDelayMs
          );
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
        }
      }
    }
  } catch (e) {
    throw new Error(e);
  }
};
