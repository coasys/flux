import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import { Channel as ChannelModel } from "utils/api";
import { SubjectRepository } from "utils/factory";

export interface Payload {
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
    const channelRepository = new SubjectRepository(ChannelModel, {
      perspectiveUuid: channel.sourcePerspective
    })

    await channelRepository.update(channel.id, {
      ...payload.data,
      views: {
        action: 'setter',
        value: payload.data.views
      }
    })

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
