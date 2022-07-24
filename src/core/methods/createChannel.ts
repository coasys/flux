// TODO: remove profile code

import {
  ChannelState,
  FeedType,
} from "@/store/types";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { ad4mClient } from "@/app";
import { CHANNEL } from "@/constants/neighbourhoodMeta";
import { nanoid } from "nanoid";

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
  const id = nanoid();

  const addLinkToChannel = await ad4mClient.perspective.addLink(
    sourcePerspective.uuid,
    {
      source: sourcePerspective.sharedUrl!,
      target: id,
      predicate: CHANNEL,
    }
  );
  
  console.debug(
    "Created new link on source social-context with result",
    addLinkToChannel
  );

  const channelNameLink = await ad4mClient.perspective.addLink(
    sourcePerspective.uuid,
    {
      source: addLinkToChannel.data.target,
      target: channelName,
      predicate: 'flux://name',
    }
  );

  console.log("Created channel name link", channelNameLink);

  const channelCreatorDidLink = await ad4mClient.perspective.addLink(
    sourcePerspective.uuid,
    {
      source: addLinkToChannel.data.target,
      target: creatorDid,
      predicate: 'flux://creator_did',
    }
  );

  console.log("Created channel creator did link", channelCreatorDidLink);

  return {
    name: channelName,
    description: "",
    creatorDid,
    id,
    createdAt: new Date().toISOString(),
    sourcePerspective: sourcePerspective.uuid,
    hasNewMessages: false,
    feedType: FeedType.Signaled,
    notifications: {
      mute: false,
    },
  } as ChannelState;
}
