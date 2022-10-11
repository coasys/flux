import { createChannel } from "@/core/methods/createChannel";
import { useAppStore } from "@/store/app";
import { ChannelState } from "@/store/types";
import { useDataStore } from "..";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  communityId: string;
  name: string;
}

export default async (payload: Payload): Promise<ChannelState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const client = await getAd4mClient();

    const community = dataStore.getCommunity(payload.communityId);

    const agent = await client.agent.me()

    const creatorDid = agent.did;

    if (community.neighbourhood !== undefined) {
      const channel = await createChannel({
        channelName: payload.name,
        creatorDid,
        sourcePerspective: community.neighbourhood.perspective,
      });

      dataStore.addChannel({
        communityId: community.neighbourhood.perspective.uuid,
        channel,
      });

      return channel;
    } else {
      const message = "Community does not exists";
      appStore.showDangerToast({
        message,
      });
      throw Error(message);
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
