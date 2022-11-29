import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL_VIEW } from "../constants/communityPredicates";
import { ChannelViews } from "../types";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  view: ChannelViews;
}

export default async function ({ perspectiveUuid, channelId, view }: Payload) {
  try {
    const client = await getAd4mClient();

    const expUrl = await client.expression.create(view, "literal");

    await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: channelId,
        predicate: CHANNEL_VIEW,
        target: expUrl,
      })
    );
    return channelId;
  } catch (e) {
    throw new Error(e);
  }
}
