import { useDataStore } from "..";
import { Factory, SubjectEntry } from "utils/helpers";
import { Channel as ChannelModel } from "utils/api";
import { SubjectRepository } from "utils/factory";
import { ChannelView } from "utils/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();
  const keyedChannels = dataStore.channels;
  const community = dataStore.getCommunity(communityId);

  try {
    const channelRepository = new SubjectRepository(ChannelModel, {
      perspectiveUuid: communityId,
      source: community.id,
    });

    const channels = await channelRepository.getAllData();

    const mappedChannels = channels.map((channel: any) => ({
      id: channel?.id,
      name: channel?.name,
      author: channel?.author,
      sourcePerspective: communityId,
      hasNewMessages: false,
      expanded: keyedChannels[channel.id]?.expanded || false,
      currentView:
        keyedChannels[channel.id]?.currentView ||
        channel.views[0] ||
        ChannelView.Chat,
      views: channel.views,
      timestamp: channel.timestamp.toString(),
      notifications: {
        mute: keyedChannels[channel.id]?.notifications.mute || false,
    }}))
    console.log('chan', mappedChannels)

    dataStore.setChannels({
      communityId,
      channels: mappedChannels,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
