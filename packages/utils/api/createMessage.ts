import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { DIRECTLY_SUCCEEDED_BY } from "../constants/communityPredicates";
import { createEntry } from "../helpers/entryHelpers";
import { EntryType } from "../types";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  message: Object;
}

export default async function ({
  perspectiveUuid,
  channelId,
  message,
}: Payload) {
  try {
    const messageEntry = await createEntry({
      perspectiveUuid,
      source: channelId,
      type: EntryType["flux://message"],
      data: {
        ["flux://content"]: message,
      },
    });

    return {
      id: messageEntry.id,
      timestamp: messageEntry.createdAt,
      author: messageEntry.author,
      reactions: [],
      replies: [],
      content: message,
      editMessages: [],
    };
  } catch (e: any) {
    throw new Error(e);
  }
}
