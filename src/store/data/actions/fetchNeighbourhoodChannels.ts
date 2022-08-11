import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { ad4mClient } from "@/app";
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { FeedType } from "@/store/types";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);
    console.log(community);
    const channelLinks = await ad4mClient.perspective.queryLinks(
      community.neighbourhood.perspective.uuid,
      new LinkQuery({
        source: SELF,
        predicate: CHANNEL,
      })
    );

    for (let i = 0; i < channelLinks.length; i++) {
        const name = channelLinks[i].data!.target;

        const found = dataStore.getChannel(community.neighbourhood.perspective.uuid, name)

        //Check that the channel is not in the store
        if (!found) {
        console.log(
            "Found channel link not in local state, adding...",
            channelLinks[i]
        );
        dataStore.addChannel({
            communityId: community.state.perspectiveUuid,
            channel: {
            id: name,
            name,
            creatorDid: channelLinks[i].author,
            sourcePerspective: community.state.perspectiveUuid,
            hasNewMessages: false,
            createdAt: new Date().toISOString(),
            feedType: FeedType.Signaled,
            notifications: {
                mute: false,
            },
            },
        });
        }
    }
  } catch (error) {
    throw new Error(error);
  }
};