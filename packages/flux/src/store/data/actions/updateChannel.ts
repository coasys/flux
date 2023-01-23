import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import { Channel as ChannelModel } from "utils/api";
import { Factory } from "utils/helpers";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  data: any;
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
    const Channel = new Factory(new ChannelModel(), {
      perspectiveUuid: payload.perspectiveUuid,
    });

    await Channel.update(channel.id, payload.data);

    dataStore.setChannel({
      communityId: channel.id,
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
