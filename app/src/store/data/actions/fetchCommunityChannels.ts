import { useDataStore } from "..";
import { Factory, SubjectEntry } from "utils/helpers";
import { Channel as ChannelModel } from "utils/api";
import { SubjectRepository } from "utils/factory";
import { ChannelView } from "utils/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();
  const keyedChannels = dataStore.channels;
  const community = dataStore.getCommunity(communityId);

  try {
    let ad4m = await getAd4mClient()
    let perspective = await ad4m.perspective.byUUID(communityId)

    const channelRepository = new SubjectRepository(ChannelModel, {
      perspectiveUuid: communityId,
      source: community.id
    })

    const channels = await channelRepository.getAll();

    const awaitedChannels = await Promise.all(channels.map(async (channel) => {
      //@ts-ignore
      const channelEntry = new SubjectEntry<ChannelModel>(channel, perspective)
      await channelEntry.load()

      return {
        id: channelEntry.id,
        name: await channel.name,
        author: channelEntry.author,
        sourcePerspective: communityId,
        hasNewMessages: false,
        expanded: keyedChannels[channel.id]?.expanded || false,
        currentView:
          keyedChannels[channelEntry.id]?.currentView ||
          channel.views[0] ||
          ChannelView.Chat,
        views: await channel.views,
        timestamp: channelEntry.timestamp.toString(),
        notifications: {
          mute: keyedChannels[channelEntry.id]?.notifications.mute || false,
        },
      }
    }))
    


    dataStore.setChannels({
      communityId,
      channels: awaitedChannels,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
