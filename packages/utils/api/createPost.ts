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
  const postData = await createPostData({ data });
  return createEntry({
    perspectiveUuid: communityId,
    source: channelId,
    types: [EntryType.Post],
    data: postData,
  });
}

async function createPostData({ data }: { data: PostData }) {
  const client = await getAd4mClient();
  const expression = client.expression;

  return {
    [TITLE]: await expression.create(data.title, "literal"),
    [BODY]: await expression.create(data.body, "literal"),
  };
}
