import { Commit } from "vuex";
import { CommunityState, ChannelState } from "@/store";

import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import { getExpression } from "@/core/queries/getExpression";
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
  community: CommunityState;
  description: string;
}

export default async ({ commit }: Context, { community }: Payload) => {
  console.log("Getting channel links");
  const channelLinks = await getChatChannelLinks(
    community.perspective,
    community.linkLanguageAddress
  );
  console.log("Got links", channelLinks);
  if (channelLinks != null) {
    for (let i = 0; i < channelLinks.length; i++) {
      if (
        community.channels.find(
          (element: ChannelState) =>
            element.sharedPerspectiveUrl === channelLinks[i].data!.target
        ) == undefined
      ) {
        console.log("Found channel link", channelLinks[i], "Adding to channel");
        const channel = await joinChannelFromSharedLink(
          channelLinks[i].data!.target!
        );
        commit("addChannel", {
          community: community.perspective,
          channel: channel,
        });
      }
    }
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const groupExpressionLinks = await getGroupExpressionLinks(
      //@ts-ignore
      community.perspective,
      //@ts-ignore
      community.linkLanguageAddress
    );
    console.log("Got group expression links", groupExpressionLinks);
    if (groupExpressionLinks != null && groupExpressionLinks.length > 0) {
      if (
        community.groupExpressionRef != groupExpressionLinks[0].data!.target!
      ) {
        let getExprRes = await getExpression(
          groupExpressionLinks[0].data!.target!
        );
        if (getExprRes == null) {
          for (let i = 0; i < expressionGetRetries; i++) {
            console.log("Retrying get of expression signal");

            getExprRes = await getExpression(
              groupExpressionLinks[0].data!.target!
            );
            if (getExprRes != null) {
              break;
            }
            await sleep(expressionGetDelayMs);
          }
          if (getExprRes == null) {
            console.warn("Could not get expression from group expression link");
            return;
          }
        }
        const groupExpData = JSON.parse(getExprRes.data!);
        console.log(
          "Got new group expression data for community",
          groupExpData
        );
        commit("updateCommunityMetadata", {
          community: community.perspective,
          name: groupExpData["foaf:name"],
          description: groupExpData["foaf:description"],
          groupExpressionRef: groupExpressionLinks[0].data!.target,
        });
      }
    }
  }
};
