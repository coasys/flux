import {
  TITLE,
  BODY,
  IMAGE,
  URL,
  START_DATE,
  END_DATE,
} from "../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../constants/languages";
import { EntryType } from "../types";
import { createEntry } from "./createEntry";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

type PostData = {
  title: string;
  body?: string;
  url?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
};

export interface Payload {
  communityId: string;
  channelId: string;
  type: EntryType;
  data: PostData;
}

export default async function ({
  communityId,
  channelId,
  type,
  data,
}: Payload) {
  const postData = await createPostData({ entryType: type, data });
  return createEntry({
    perspectiveUuid: communityId,
    source: channelId,
    types: [type],
    data: postData,
  });
}

async function createPostData({
  entryType,
  data,
}: {
  entryType: EntryType;
  data: PostData;
}) {
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
        [IMAGE]: await expression.create(
          data.image,
          NOTE_IPFS_EXPRESSION_OFFICIAL
        ),
      };
    case EntryType.CalendarEvent:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [BODY]: await expression.create(data.body, "literal"),
        [START_DATE]: await expression.create(data.startDate, "literal"),
        [END_DATE]: await expression.create(data.endDate, "literal"),
      };
    case EntryType.LinkPost:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [URL]: await expression.create(data.url, "literal"),
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
