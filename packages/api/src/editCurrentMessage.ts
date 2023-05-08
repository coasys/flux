import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { community } from "@fluxapp/constants";
import getMessage from "./getMessage";
const { EDITED_TO } = community;

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
    const exp = await client.expression.create(message, "literal");

    const result = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: lastMessage,
        target: exp,
        predicate: EDITED_TO,
      })
    );

    const messageParsed = getMessage(result);

    return messageParsed;
  } catch (e: any) {
    throw new Error(e);
  }
}
