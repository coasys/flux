import { createChannel } from "@/core/methods/createChannel";
import { useAppStore } from "@/store/app";
import { ChannelState, MembraneType } from "@/store/types";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
  name: string;
}

export default async (
  payload: Payload
): Promise<ChannelState> => {
  const dataStore =
    useDataStore();
  const appStore = useAppStore();
  try {
    const community = dataStore.getCommunity(payload.communityId);

    if (community.neighbourhood !== undefined) {
      const channel = await createChannel(
        payload.name,
        appStore.getLanguagePath,
        community.neighbourhood.perspective,
        MembraneType.Inherited,
        community.neighbourhood.typedExpressionLanguages
      );

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
