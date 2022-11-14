import {
  TITLE,
  BODY,
  IMAGE,
  URL,
  START_DATE,
  END_DATE,
} from "../constants/communityPredicates";
import { EntryInput, EntryType } from "../types";
import { createEntry } from "./createEntry";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  perspectiveUuid: string;
  source: string;
  type: EntryType;
  data: any;
}

export default async function ({
  perspectiveUuid,
  source,
  type,
  data,
}: Payload) {
  const postData = await createPostData(data);
  const entryInput = {
    perspectiveUuid,
    source,
    types: [type],
    data: postData,
  } as EntryInput;
  return createEntry(entryInput);
}

async function createPostData({ entryType, data }) {
  const client = await getAd4mClient();
  const expression = client.expression;

  switch (entryType) {
    case EntryType.SimplePost:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [BODY]: await expression.create(data.body, "literal"),
      };
    case EntryType.ImagePost:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [IMAGE]: data.image,
      };
    case EntryType.CalendarEvent:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [BODY]: await expression.create(data.body, "literal"),
        [START_DATE]: await expression.create(data.startDate, "literal"),
        [END_DATE]: await expression.create(data.endDate, "literal"),
      };
  }
}
