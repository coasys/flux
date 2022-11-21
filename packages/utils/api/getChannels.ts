import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL, CHANNEL_VIEW, SELF } from "../constants/communityPredicates";
import { channelQuery, DEFAULT_LIMIT } from "../constants/sdna";
import { Channel, Entry } from "../types";
import getEntries from "./getEntries";

export interface Payload {
  perspectiveUuid: string;
}

export default async function ({ perspectiveUuid }: Payload) {
  try {
    const entries = await getEntries({
      perspectiveUuid,
      queries: [
        {
          query: channelQuery,
          variables: {
            limit: DEFAULT_LIMIT,
            source: SELF,
          },
          resultKeys: [
            "Id",
            "Timestamp",
            "Author",
            "ChannelName",
            "ChannelViews"
          ],
        },
      ],
    })

    const channels: Channel[] = [];

    if (entries.length > 0) {
      for (const channel of entries as Entry[]) {
        const channelName = Literal.fromUrl(channel.data!["ChannelName"][0]['content']).get().data;

        const views = channel.data!["ChannelViews"]
          ? channel.data!["ChannelViews"].map(
              (view: LinkExpression) => Literal.fromUrl(view.content).get().data
            )
          : [];

        channels.push({
          id: channel.id.replace("flux_entry://", ""),
          perspectiveUuid: perspectiveUuid,
          name: channelName,
          description: "",
          timestamp: channel.timestamp,
          author: channel.author,
          views: views,
        });
      }
    }

    return channels;
  } catch (e) {
    throw new Error(e);
  }
}
