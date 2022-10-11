import { Link } from "@perspect3vism/ad4m";
import { REPLY_TO, DIRECTLY_SUCCEEDED_BY } from "../constants/ad4m";
import ad4mClient from "./client";
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
    const expUrl = await ad4mClient.expression.create(message, 'literal');

    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: channelId,
        target: expUrl,
        predicate: DIRECTLY_SUCCEEDED_BY,
      })
    );
    const link = await ad4mClient.perspective.addLink(
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
