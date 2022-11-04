import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL, CHANNEL_VIEW, SELF } from "../constants/communityPredicates";
import { mapLiteralLinks } from "../helpers/linkHelpers";
import { Channel } from "../types";

export interface Payload {
  perspectiveUuid: string;
}

export default async function ({ perspectiveUuid }: Payload) {
  try {
    const client = await getAd4mClient();

    const expressionLinks = await client.perspective.queryProlog(
      perspectiveUuid,
      `link("${SELF}", "${CHANNEL}", Target, Timestamp, Author).`
    );

    const channels: Channel[] = [];

    if (expressionLinks) {
      for (const channel of expressionLinks as LinkExpression[]) {
        const channelViews = await client.perspective.queryProlog(
          perspectiveUuid,
          `link("${channel.Target}", "${CHANNEL_VIEW}", Target, Timestamp, Author).`
        );

        const literal = Literal.fromUrl(channel.Target).get();

        channels.push({
          id: literal.data,
          perspectiveUuid: perspectiveUuid,
          name: literal.data,
          description: "",
          timestamp: literal.timestamp,
          author: channel.A,
          views: channelViews.map(
            (view: LinkExpression) => Literal.fromUrl(view.Target).get().data
          ),
        });
      }
    }

    return channels;
  } catch (e) {
    throw new Error(e);
  }
}
