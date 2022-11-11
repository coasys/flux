import { Literal } from "@perspect3vism/ad4m";
import { TITLE, BODY } from "../constants/communityPredicates";
import { EntryInput, EntryType } from "../types";
import { createEntry } from "./createEntry";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  title: string;
  body: string;
}

export default async function ({
  perspectiveUuid,
  channelId,
  title,
  body,
}: Payload) {
  try {
    const entryInput = {
      perspectiveUuid,
      source: channelId,
      types: [EntryType.Forum],
      data: {
        [TITLE]: Literal.from(title).toUrl(),
        [BODY]: Literal.from(body).toUrl()
      }
    } as EntryInput

    const entry = await createEntry(entryInput);
    console.log("created entry", entry);
  } catch (e: any) {
    throw new Error(e);
  }
}
