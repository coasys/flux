import { Post, Entry } from "../types";
import getEntries from "./getEntries";
import {
  DEFAULT_LIMIT,
  forumFilteredQuery,
  forumQuery,
} from "../constants/sdna";
import { Literal } from "@perspect3vism/ad4m";

function getContent(acc, link: any) {
  return acc?.timestamp > link?.timestamp
    ? acc
    : link.content.startsWith("literal://")
    ? Literal.fromUrl(link.content).get()
    : link;
}

function cleanPostData(entry: Entry): Post {
  const data = entry.data;
  return {
    id: entry.id,
    types: entry.types?.map((d) => d.content),
    author: entry.author,
    timestamp: entry.timestamp,
    image: data?.Image?.reduce(getContent, null)?.content,
    startDate: data?.StartDate?.reduce(getContent, null)?.data,
    endDate: data?.EndDate?.reduce(getContent, null)?.data,
    url: data?.Url?.reduce(getContent, null)?.data,
    title: data?.Title?.reduce(getContent, null)?.data,
    body: data?.Body?.reduce(getContent, null)?.data,
    isPopular: data?.IsPopular,
    replies: data?.Replies.map(cleanPostData),
    reactions: data?.Reactions.map((r) => r.content.replace("emoji://")),
  };
}

export default async function getPosts(
  perspectiveUuid: string,
  source: string,
  fromDate?: Date
): Promise<Post[]> {
  return getEntries({
    perspectiveUuid,
    queries: [
      {
        query: fromDate ? forumFilteredQuery : forumQuery,
        variables: {
          limit: DEFAULT_LIMIT,
          source,
          fromDate: fromDate?.getTime(),
        },
        resultKeys: [
          "Id",
          "Types",
          "Timestamp",
          "Author",
          "StartDate",
          "EndDate",
          "Title",
          "Url",
          "Image",
          "Body",
          "Reactions",
          "Replies",
          "IsPopular",
        ],
      },
    ],
  }).then((entries) => entries.map(cleanPostData));
}
