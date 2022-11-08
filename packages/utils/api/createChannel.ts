import {
  AD4M_CLASS,
  CHANNEL,
  CHANNEL_NAME,
  SELF,
  FLUX_CHANNEL,
  CHANNEL_VIEW,
} from "utils/constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Channel, EntryType } from "../types";
import { createEntry } from "../helpers/entryHelpers";

interface ChannelProps {
  view?: string;
  channelName: string;
  perspectiveUuid: string;
}

export async function createChannel({
  channelName,
  view = "chat",
  perspectiveUuid,
}: ChannelProps): Promise<Channel> {
  try {
    const channel = await createEntry({
      perspectiveUuid,
      type: EntryType["flux://channel"],
      data: {
        [CHANNEL_NAME]: channelName,
        [CHANNEL_VIEW]: view,
        [AD4M_CLASS]: FLUX_CHANNEL,
      },
    });

    return {
      id: channel.id,
      name: channelName,
      description: "",
      author: channel.author,
      timestamp: channel.createdAt,
      perspectiveUuid: perspectiveUuid,
      views: [view],
    };
  } catch (e) {
    throw new Error(e);
  }
}
