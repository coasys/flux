// TODO: remove profile code

import { ChannelState } from "@/store/types";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import {
  AD4M_CLASS,
  CHANNEL,
  CHANNEL_NAME,
  SELF,
  FLUX_CHANNEL,
} from "utils/constants/communityPredicates";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

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
  const client = await getAd4mClient();

  const channel = dataStore.channels[channelName];
  const channelExpr = await client.expression.create(channelName, "literal");

  if (!channel || channel.sourcePerspective !== sourcePerspective.uuid) {
    const linkExpression = await client.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: SELF,
        target: channelExpr,
        predicate: CHANNEL,
      }
    );
    const linkExpressionChannelName = await client.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: channelExpr,
        target: channelExpr,
        predicate: CHANNEL_NAME,
      }
    );
    const linkExpressionChannelClass = await client.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: channelExpr,
        target: FLUX_CHANNEL,
        predicate: AD4M_CLASS,
      }
    );

    console.debug(
      "Created new link on source social-context with result",
      linkExpression,
      linkExpressionChannelName,
      linkExpressionChannelClass
    );

    return {
      name: channelName,
      description: "",
      creatorDid,
      id: channelExpr,
      createdAt: new Date().toISOString(),
      sourcePerspective: sourcePerspective.uuid,
      hasNewMessages: false,
      notifications: {
        mute: false,
      },
    } as ChannelState;
  }

  const errorMessage = "Channel with this name already exists";

  appStore.showDangerToast({
    message: errorMessage,
  });

  throw new Error(errorMessage);
}
