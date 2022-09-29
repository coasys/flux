import { useDataStore } from "..";
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { FeedType } from "@/store/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  try {
    const client = await getAd4mClient();

    const community = dataStore.getCommunity(communityId);
    const channelLinks = await client.perspective.queryProlog(
      community.neighbourhood.perspective.uuid,
      `triple("${SELF}", "${CHANNEL}", C).`
    );

    for (let i = 0; i < channelLinks.length; i++) {
      const name = channelLinks[i].C;

      const found = dataStore.getChannel(
        community.neighbourhood.perspective.uuid,
        name
      );

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
