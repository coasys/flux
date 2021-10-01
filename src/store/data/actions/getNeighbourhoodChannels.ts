import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { getLinks } from "@/core/queries/getLinks";

export interface Payload {
  communityId: string;
}

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async ({ communityId }: Payload): Promise<void> => {
  const dataStore = useDataStore();

  try {
    const community = dataStore.getCommunity(communityId);

    const channelLinks = await getLinks(
      community.neighbourhood.perspective.uuid,
      new LinkQuery({
        source: `${community.neighbourhood.neighbourhoodUrl}://self`,
        predicate: "sioc://has_space",
      })
    );

    for (let i = 0; i < channelLinks.length; i++) {
      //Check that the channel is not in the store
      if (
        Object.values(community.neighbourhood.linkedNeighbourhoods).find(
          (neighbourhoodUrl) =>
            neighbourhoodUrl === channelLinks[i].data!.target
        ) == undefined
      ) {
        console.log("Found channel link", channelLinks[i], "Adding to channel");
        //Call ad4m and try to join the sharedperspective found at link target
        const channel = await joinChannelFromSharedLink(
          channelLinks[i].data!.target!,
          community.neighbourhood.perspective.uuid
        );
        console.log(
          "trying to join channel",
          channel,
          community.neighbourhood.perspective.uuid
        );
        //Add the channel to the store
        dataStore.addChannel({
          communityId: community.neighbourhood.perspective.uuid,
          channel: channel,
        });
      }
    }
  } catch (e) {
    throw new Error(e);
  }
};
