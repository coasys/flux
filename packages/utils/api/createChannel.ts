import {
  AD4M_CLASS,
  CHANNEL,
  CHANNEL_NAME,
  SELF,
  FLUX_CHANNEL,
  CHANNEL_VIEW,
} from "utils/constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Channel } from "../types";

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
    const client = await getAd4mClient();

    const channelExpr = await client.expression.create(channelName, "literal");

    const linkExpression = await client.perspective.addLink(perspectiveUuid, {
      source: SELF,
      target: channelExpr,
      predicate: CHANNEL,
    });

    await client.perspective.addLink(perspectiveUuid, {
      source: channelExpr,
      target: channelExpr,
      predicate: CHANNEL_NAME,
    });

    await client.perspective.addLink(perspectiveUuid, {
      source: channelExpr,
      target: await client.expression.create(view, "literal"),
      predicate: CHANNEL_VIEW,
    });

    await client.perspective.addLink(perspectiveUuid, {
      source: channelExpr,
      target: FLUX_CHANNEL,
      predicate: AD4M_CLASS,
    });

    return {
      id: channelExpr,
      name: channelName,
      description: "",
      author: linkExpression.author,
      timestamp: linkExpression.timestamp || new Date().toISOString(),
      perspectiveUuid: perspectiveUuid,
      views: [view],
    };
  } catch (e) {
    throw new Error(e);
  }
}
