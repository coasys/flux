import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { BODY, REPLY_TO } from "../constants/communityPredicates";
import { EntryType } from "../types";
import { createEntry } from "./createEntry";

export interface Payload {
  perspectiveUuid: string;
  postId: string;
  message: string;
}

export default async function ({ perspectiveUuid, postId, message }: Payload) {
  try {
    const client = await getAd4mClient();

    const expUrl = await client.expression.create(message, "literal");

    const entry = await createEntry({
      source: postId,
      perspectiveUuid,
      types: [EntryType.Message],
      data: {
        [BODY]: expUrl,
      },
    });

    await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: postId,
        predicate: REPLY_TO,
        target: entry.id,
      })
    );

    return entry;
  } catch (e: any) {
    throw new Error(e);
  }
}
