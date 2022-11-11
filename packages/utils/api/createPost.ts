import { TITLE, BODY } from "../constants/communityPredicates";
import { EntryInput, EntryType } from "../types";
import { createEntry } from "./createEntry";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  perspectiveUuid: string;
  source: string;
  title: string;
  body: string;
}

export default async function ({
  perspectiveUuid,
  source,
  title,
  body,
}: Payload) {
  const client = await getAd4mClient();
  const entryInput = {
    perspectiveUuid,
    source,
    types: [EntryType.SimplePost],
    data: {
      [TITLE]: await client.expression.create(title, 'literal'),
      [BODY]: await client.expression.create(body, 'literal')
    }
  } as EntryInput

  const entry = await createEntry(entryInput);
  console.log("created entry", entry);
}
