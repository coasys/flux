import {
  AD4M_CLASS,
  CHANNEL,
  CHANNEL_NAME,
  SELF,
  FLUX_CHANNEL,
  CHANNEL_VIEW,
} from "utils/constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Channel, ChannelView, EntryType } from "../types";
import { createEntry } from "./createEntry";

interface ChannelProps {
  views: ChannelView[];
  channelName: string;
  perspectiveUuid: string;
}

export async function createChannel({
  channelName,
  views,
  perspectiveUuid,
}: ChannelProps): Promise<Channel> {
  try {
    const client = await getAd4mClient();

    const data = {
      [CHANNEL_NAME]: await client.expression.create(channelName, "literal"),
      [AD4M_CLASS]: FLUX_CHANNEL,
    };

    const entry = await createEntry({
      perspectiveUuid,
      types: [EntryType.Channel],
      data,
    });

    views.forEach(async (view) => {
      await client.perspective.addLink(perspectiveUuid, {
        source: entry.id,
        target: view,
        predicate: CHANNEL_VIEW,
      });
    });

    return {
      id: entry.id.replace("flux_entry://", ""),
      name: channelName,
      description: "",
      author: entry.author,
      timestamp: entry.timestamp || new Date().toISOString(),
      perspectiveUuid: perspectiveUuid,
      views: views,
    };
  } catch (e) {
    throw new Error(e);
  }
}
