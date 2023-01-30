import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import ChannelModel, { UpdateChannel } from "utils/api/channel";

export interface Payload {
  channelId: string;
  data: UpdateChannel;
}

export default async (payload: Payload): Promise<any> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const channel = dataStore.channels[payload.channelId];

  if (!channel) {
    appStore.showDangerToast({
      message: "Couldn't find a channel to add the view to",
    });
  }

  try {
    const Channel = new ChannelModel({
      perspectiveUuid: channel.sourcePerspective,
    });

    await Channel.update(channel.id, payload.data);

    dataStore.setChannel({
      channel: {
        ...channel,
        ...payload.data,
      },
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
