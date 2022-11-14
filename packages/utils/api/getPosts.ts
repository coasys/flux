import { Post } from "../types";
import { GetEntries } from "../types";
import getEntries from "./getEntries";
import {
  DEFAULT_LIMIT,
  forumFilteredQuery,
  forumQuery,
} from "../constants/sdna";
import { Literal } from "@perspect3vism/ad4m";

function cleanPostData(prologEntry: any) {
  const post = prologEntry as Post;

  //Clean up the emoji string
  prologEntry.data?.Reactions.forEach((reaction: any) => {
    reaction.content = reaction.content.replace("emoji://");
  });
  post.reactions = prologEntry.data?.Reactions;

  //Clean up the title and body
  prologEntry.data?.Title.forEach((title: any) => {
    title.content = Literal.fromUrl(title.content).get().data;
  });
  post.title = prologEntry.data?.Title;
  prologEntry.data?.Body.forEach((body: any) => {
    body.content = Literal.fromUrl(body.content).get().data;
  });
  post.body = prologEntry.data?.Body;
  post.isPopular = prologEntry.data?.IsPopular;

  //Clean up the replies
  prologEntry.data?.Replies.forEach((reply: any) => {
    cleanPostData(reply);
  });
  post.replies = prologEntry.data?.Replies;
  return post;
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
        arguments: [DEFAULT_LIMIT, source, fromDate?.getTime()],
        resultKeys: [
          "Id",
          "Timestamp",
          "Author",
          "Title",
          "Body",
          "Reactions",
          "Replies",
          "IsPopular",
        ],
      },
    ],
  }).then((entries) => entries.map(cleanPostData));
}
