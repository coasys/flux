import addChannelView from "utils/api/addChannelView";
import { useAppStore } from "@/store/app";
import { ChannelState } from "@/store/types";
import { useDataStore } from "..";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  view: string;
}

export default async (payload: Payload): Promise<any> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const channel = dataStore.getChannel(
    payload.perspectiveUuid,
    payload.channelId
  );

  if (channel) {
    try {
      await addChannelView({
        perspectiveUuid: payload.perspectiveUuid,
        channelId: channel.id,
        view: payload.view,
      });
      dataStore.putChannelView({
        channelId: channel.id,
        view: payload.view,
      });
    } catch (e) {
      appStore.showDangerToast({
        message: e.message,
      });
      throw new Error(e);
    }
  } else {
    appStore.showDangerToast({
      message: "Couldn't find a channel to add the view to",
    });
  }
};
