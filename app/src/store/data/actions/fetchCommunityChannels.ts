import { useDataStore } from "..";
import ChannelModel from "utils/api/channel";
import { getApp } from "@/utils/npmApi";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();
  const keyedChannels = dataStore.channels;

  try {
    const Channel = new ChannelModel({ perspectiveUuid: communityId });
    const channels = await Channel.getAll();

    const channelData = await Promise.all(
      channels.map(async (channel) => ({
        id: channel.id,
        name: channel.name,
        author: channel.author,
        sourcePerspective: communityId,
        hasNewMessages: false,
        expanded: keyedChannels[channel.id]?.expanded || false,
        currentView: keyedChannels[channel.id]?.currentView || channel.views[0],
        views: await Promise.all(channel.views.map((view) => getApp(view))),
        timestamp: new Date(channel.timestamp),
        notifications: {
          mute: keyedChannels[channel.id]?.notifications.mute || false,
        },
      }))
    );

    dataStore.setChannels({
      communityId,
      channels: channelData,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
