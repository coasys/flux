import { useAppStore } from "@/store/app";
import { ChannelState } from "@/store/types";
import { useDataStore } from "..";
import { ChannelView } from "utils/types";
import { Channel as ChannelModel } from "utils/api";
import { Factory, SubjectEntry } from "utils/helpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

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

    let ad4m = await getAd4mClient()
    let perspective = await ad4m.perspective.byUUID(payload.perspectiveUuid)
    await perspective!.ensureSDNASubjectClass(ChannelModel)

    const Channel = new Factory(new ChannelModel(), {
      perspectiveUuid: payload.perspectiveUuid,
    });

    const channel = await Channel.create({
      name: payload.name,
      views: payload.views,
    });

    //@ts-ignore
    const channelEntry = new SubjectEntry(channel, perspective)
    await channelEntry.load()

    const channelState = {
      id: channelEntry.id,
      name: payload.name,
      timestamp: channelEntry.timestamp.toString(),
      author: channelEntry.author,
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
