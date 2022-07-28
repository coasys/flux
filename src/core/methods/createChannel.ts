// TODO: remove profile code

import {
  ChannelState,
  FeedType,
} from "@/store/types";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { ad4mClient } from "@/app";
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";

interface ChannelProps {
  channelName: string;
  creatorDid: string;
  sourcePerspective: PerspectiveHandle;
}

export async function createChannel({
  channelName,
  creatorDid,
  sourcePerspective,
}: ChannelProps): Promise<ChannelState> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const channel = dataStore.channels[channelName];
  if (!channel || channel.sourcePerspective !== sourcePerspective.uuid) {
    const linkExpression = await ad4mClient.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: SELF,
        target: channelName,
        predicate: CHANNEL,
      }
    );

    console.debug(
      "Created new link on source social-context with result",
      linkExpression
    );

    return {
      name: channelName,
      description: "",
      creatorDid,
      id: channelName,
      createdAt: new Date().toISOString(),
      sourcePerspective: sourcePerspective.uuid,
      hasNewMessages: false,
      feedType: FeedType.Signaled,
      notifications: {
        mute: false,
      },
    } as ChannelState;
  }

  const errorMessage = 'Channel with this name already exists';

  appStore.showDangerToast({
    message: errorMessage,
  });

  throw new Error(errorMessage)
}
