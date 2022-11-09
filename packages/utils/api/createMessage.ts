import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { DIRECTLY_SUCCEEDED_BY } from "../constants/communityPredicates";
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
    const client = await getAd4mClient();
    const exp = await client.expression.create(message, 'literal');

    const result = await client.perspective.addLink(
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
