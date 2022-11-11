import { useDataStore } from "..";
import getChannels from "utils/api/getChannels";
import { ChannelState } from "@/store/types";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  try {
    const channels = await getChannels({ perspectiveUuid: communityId });

    const channelStates: ChannelState[] = channels.map((channel) => {
      return {
        id: channel.id,
        name: channel.name,
        author: channel.author,
        sourcePerspective: channel.perspectiveUuid,
        hasNewMessages: false,
        collapsed: false,
        currentView: channel.views[0] || "chat",
        views: channel.views,
        timestamp: channel.timestamp,
        notifications: {
          mute: false,
        },
      };
    });

    dataStore.setChannels({ communityId, channels: channelStates });
  } catch (error) {
    throw new Error(error);
  }
};
