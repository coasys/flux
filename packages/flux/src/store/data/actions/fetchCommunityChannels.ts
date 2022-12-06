import { useDataStore } from "..";
import getChannels from "utils/api/getChannels";
import { ChannelState } from "@/store/types";
import ChannelModel from "utils/api/channel";
import { ChannelView } from "utils/types";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  try {
    const Channel = new ChannelModel({ perspectiveUuid: communityId });
    const channels = await Channel.getAll();

    dataStore.setChannels({
      communityId,
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        author: channel.author,
        sourcePerspective: communityId,
        hasNewMessages: false,
        collapsed: false,
        currentView: channel.views[0] || ChannelView.Chat,
        views: channel.views,
        timestamp: new Date(channel.timestamp),
        notifications: {
          mute: false,
        },
      })),
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
