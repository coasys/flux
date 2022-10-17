import { useDataStore } from "..";
import { CHANNEL, SELF } from "utils/constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Literal } from "@perspect3vism/ad4m";

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
      const channel = channelLinks[i].C;

      const channelExp = await Literal.fromUrl(channel).get();

      const found = dataStore.getChannel(
        community.neighbourhood.perspective.uuid,
        channelExp.data
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
            id: channel,
            name: channelExp.data,
            creatorDid: channelLinks[i].author,
            sourcePerspective: community.state.perspectiveUuid,
            hasNewMessages: false,
            createdAt: channelExp.timestamp || new Date().toISOString(),
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
