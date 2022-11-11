import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { REPLY_TO } from "../constants/communityPredicates";
import { EntryType } from "../types";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  replyUrl: string;
  message: Object;
  channelId: string;
}

export default async function ({
  perspectiveUuid,
  replyUrl,
  message,
  channelId,
}: Payload) {
  try {
    const client = await getAd4mClient();
    
    const expUrl = await client.expression.create(message, 'literal');

    await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: channelId,
        target: expUrl,
        predicate: EntryType.Message,
      })
    );
    const link = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: replyUrl,
        target: expUrl,
        predicate: REPLY_TO,
      })
    );

    const messageParsed = getMessage(link);

    return messageParsed; 
  } catch (e: any) {
    throw new Error(e);
  }
}
