import { Literal } from "@perspect3vism/ad4m";
import { MAX_MESSAGES } from "../constants/general";
import { Reaction } from "../types";
import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  from?: Date;
}

export default async function ({
  perspectiveUuid,
  channelId,
  from,
}: Payload) {
  try {
    let expressionLinks;
    if (from) {
      console.log("Making time based query");
      let fromTime = from.getTime();
      expressionLinks = await ad4mClient.perspective.queryProlog(
        perspectiveUuid, 
        `limit(${MAX_MESSAGES}, (order_by([desc(Timestamp)], flux_message("${channelId}", MessageExpr, Timestamp, Author, Reactions, Replies, AllCardHidden)), Timestamp =< ${fromTime})).`
      );
      console.log(expressionLinks);
    } else {
      expressionLinks = await ad4mClient.perspective.queryProlog(
        perspectiveUuid,
        `limit(${MAX_MESSAGES}, order_by([desc(Timestamp)], flux_message("${channelId}", MessageExpr, Timestamp, Author, Reactions, Replies, AllCardHidden))).`
      );
      console.log(expressionLinks);
    }
    let cleanedLinks = [];

    //TODO; the below extracting of data from head & tail can likely happen in ad4m-executor, it currently gets returned like this since this is how the node.js swipl wrapper serializes results from swipl
    if (expressionLinks) {
      for (const message of expressionLinks) {
        let reactions: Reaction[] = [];
        if (typeof message.Reactions !== "string") {
          if (message.Reactions.head) {
            reactions.push({
              content: message.Reactions.head.args[0].replace('emoji://', ''),
              timestamp: new Date(message.Reactions.head.args[1].args[0]),
              author: message.Reactions.head.args[1].args[1],
            });
          }
          let tail = message.Reactions.tail;
          while (typeof tail !== "string") {
            reactions.push({
              content: tail.head.args[0].replace('emoji://', ''),
              timestamp: new Date(tail.head.args[1].args[0]),
              author: tail.head.args[1].args[1],
            });
            tail = tail.tail;
          }
        }

        let replies = [];
        if (typeof message.Replies != "string") {
          if (message.Replies.head) {
            const literal = Literal.fromUrl(message.Replies.head.args[0]).get();
            replies.push({
              content: literal.data,
              timestamp: new Date(message.Replies.head.args[1].args[0]),
              author: literal.author,
            });
          }
          let tail = message.Replies.tail;
          while (typeof tail != "string") {
            const literal = Literal.fromUrl(tail.head.args[0]).get();
            replies.push({
              content: literal.data,
              timestamp: new Date(tail.head.args[1].args[0]),
              author: literal.author,
            });
            tail = tail.tail;
          }
        }

        let isNeighbourhoodCardHidden = typeof message.AllCardHidden != "string";

        cleanedLinks.push({
          id: message.MessageExpr,
          author: message.Author,
          content: Literal.fromUrl(message.MessageExpr).get().data,
          timestamp: new Date(message.Timestamp),
          reactions: reactions,
          replies: replies,
          isNeighbourhoodCardHidden
        });
      }
    }

    const keyedMessages = cleanedLinks.reduce((acc, message) => {
      //@ts-ignore
      return { ...acc, [message.id]: message };
    }, {});

    return {
      keyedMessages: keyedMessages,
      expressionLinkLength: expressionLinks.length,
    };
  } catch (e: any) {
    throw new Error(e);
  }
}
