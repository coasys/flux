import { Link, Literal } from "@perspect3vism/ad4m";
import { DIRECTLY_SUCCEEDED_BY } from "../constants/ad4m";
import ad4mClient from "./client";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  lastMessage: string;
  message: Object;
}

export default async function ({
  perspectiveUuid,
  lastMessage,
  message,
}: Payload) {
  try {
    const exp = await ad4mClient.expression.create(message, 'literal');

    const result = await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: lastMessage,
        target: exp,
        predicate: DIRECTLY_SUCCEEDED_BY,
      })
    );

    const messageParsed = getMessage(result);

    return messageParsed;
  } catch (e: any) {
    throw new Error(e);
  }
}
