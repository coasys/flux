import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";
import { ChannelState } from "@/store/types";
import { useDataStore } from "..";

export interface Payload {
  parentCommunityId: string;
  neighbourhoodUrl: string;
}

let isCallbackRunning = false;

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async ({
  parentCommunityId,
  neighbourhoodUrl,
}: Payload): Promise<ChannelState | undefined> => {
  const dataStore = useDataStore();

  //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
  const community = dataStore.getCommunity(parentCommunityId);

  if (!isCallbackRunning) {
    isCallbackRunning = true;
    //Check that no other worker callback is executing
    try {
      //Call ad4m and try to join the sharedperspective found at link target
      const channel = await joinChannelFromSharedLink(
        neighbourhoodUrl,
        community.neighbourhood.perspective.uuid
      );
      console.log(
        "Joined channel",
        channel,
        community.neighbourhood.perspective.uuid
      );
      //Add the channel to the store
      dataStore.addChannel({
        communityId: community.neighbourhood.perspective.uuid,
        channel: channel,
      });
      isCallbackRunning = false;
      return channel;
    } catch (error) {
      isCallbackRunning = false;
      throw new Error(error);
    }
  }
};
