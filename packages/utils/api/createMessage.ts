import { Expression, Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";
import { EntryType } from "../types";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  source: string;
  message: Object;
  literal?: string;
}

export default async function ({
  perspectiveUuid,
  source,
  message,
  literal,
}: Payload) {
  try {
    const client = await getAd4mClient();
    const exp = literal
      ? literal
      : await client.expression.create(message, "literal");

    const result = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: source,
        target: exp,
        predicate: EntryType.Message,
      })
    );

    const messageParsed = getMessage(result);

    return messageParsed;
  } catch (e: any) {
    throw new Error(e);
  }
}
