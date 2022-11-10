import { createChannel } from "utils/api/createChannel";
import { useAppStore } from "@/store/app";
import { ChannelState } from "@/store/types";
import { useDataStore } from "..";
import { ChannelView } from "utils/types";

export interface Payload {
  perspectiveUuid: string;
  name: string;
  views: ChannelView[];
}

export default async (payload: Payload): Promise<ChannelState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const community = dataStore.getCommunity(payload.perspectiveUuid);

    if (!community) {
      const message = "Community does not exists";
      appStore.showDangerToast({
        message,
      });
      throw Error(message);
    }

    const channel = await createChannel({
      channelName: payload.name,
      views: payload.views,
      perspectiveUuid: payload.perspectiveUuid,
    });

    const channelState = {
      id: channel.id,
      name: channel.name,
      timestamp: channel.timestamp,
      author: channel.author,
      sourcePerspective: channel.perspectiveUuid,
      currentView: channel.views[0],
      views: channel.views,
      hasNewMessages: false,
      notifications: {
        mute: false,
      },
    };

    dataStore.addChannel({
      communityId: payload.perspectiveUuid,
      channel: channelState,
    });

    return channelState;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
