import { createChannel } from "utils/api/createChannel";
import { useAppStore } from "@/store/app";
import { ChannelState } from "@/store/types";
import { useDataStore } from "..";
import { ChannelView } from "utils/types";
import ChannelModel from "utils/api/channel";

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

    const Channel = new ChannelModel({
      perspectiveUuid: payload.perspectiveUuid,
    });

    const channel = await Channel.create({
      name: payload.name,
      views: payload.views,
    });

    const channelState = {
      id: channel.id,
      name: payload.name,
      timestamp: channel.timestamp.toString(),
      author: channel.author,
      collapsed: false,
      sourcePerspective: payload.perspectiveUuid,
      currentView: payload.views[0],
      views: payload.views,
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
