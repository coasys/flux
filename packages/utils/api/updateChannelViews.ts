import { Link, LinkQuery } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL_VIEW } from "../constants/communityPredicates";
import { ChannelView } from "../types";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  views: ChannelView[];
}

export default async function ({ perspectiveUuid, channelId, views }: Payload) {
  try {
    const client = await getAd4mClient();

    const viewLinks = await client.perspective.queryLinks(perspectiveUuid, {
      source: channelId,
      predicate: CHANNEL_VIEW,
    } as LinkQuery);

    viewLinks.forEach(async (link) => {
      await client.perspective.removeLink(perspectiveUuid, link);
    });

    views.forEach(async (view) => {
      await client.perspective.addLink(
        perspectiveUuid,
        new Link({
          source: channelId,
          predicate: CHANNEL_VIEW,
          target: view,
        })
      );
    });

    return channelId;
  } catch (e) {
    throw new Error(e);
  }
}
