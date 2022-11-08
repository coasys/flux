import { createEntry } from "../helpers/entryHelpers";
import { EntryType } from "../types";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  message: string;
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
