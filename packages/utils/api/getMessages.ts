import { Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { MAX_MESSAGES } from "../constants/general";
import { Message, Reaction } from "../types";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  from?: Date;
  backwards?: boolean
}

export default async function ({
  perspectiveUuid,
  channelId,
  from,
  backwards
}: Payload) {
  try {
    const client = await getAd4mClient();
    
    let expressionLinks;
    if (from && backwards) {
      console.log("Making time based query backwards", from);
      let fromTime = from.getTime();
      expressionLinks = await client.perspective.queryProlog(
        perspectiveUuid, 
        `(order_by([asc(Timestamp)], flux_message_query_popular("${channelId}", MessageExpr, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp >= ${fromTime}).`
      );
    } else if (from) {
      console.log("Making time based query");
      let fromTime = from.getTime();
      expressionLinks = await client.perspective.queryProlog(
        perspectiveUuid, 
        `limit(${MAX_MESSAGES}, (order_by([desc(Timestamp)], flux_message_query_popular("${channelId}", MessageExpr, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp =< ${fromTime})).`
      );
    } else {
      expressionLinks = await client.perspective.queryProlog(
        perspectiveUuid,
        `limit(${MAX_MESSAGES}, order_by([desc(Timestamp)], flux_message_query_popular("${channelId}", MessageExpr, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular))).`
      );
    }


    let cleanedLinks: Message[] = [];

    //TODO; the below extracting of data from head & tail can likely happen in ad4m-executor, it currently gets returned like this since this is how the node.js swipl wrapper serializes results from swipl
    if (expressionLinks) {
      for (const message of expressionLinks) {
        let reactions: Reaction[] = [];
        if (typeof message.Reactions !== "string" && !message.Reactions.variable) {
          if (message.Reactions.head) {
            reactions.push({
              content: message.Reactions.head.args[0].replace('emoji://', ''),
              timestamp: new Date(message.Reactions.head.args[1].args[0]),
              author: message.Reactions.head.args[1].args[1],
            });
          }
          let tail = message.Reactions.tail;
          while (typeof tail !== "string" && !message.Reactions.variable) {
            reactions.push({
              content: tail.head.args[0].replace('emoji://', ''),
              timestamp: new Date(tail.head.args[1].args[0]),
              author: tail.head.args[1].args[1],
            });
            tail = tail.tail;
          }
        }

        let replies = [];
        if (typeof message.Replies != "string" && !message.Replies.variable) {

          if (message.Replies.head) {
            const literal = Literal.fromUrl(message.Replies.head.args[0]).get();
            console.log('wow', new Date(literal.timestamp), new Date(message.Replies.head.args[1].args[0]))
            replies.push({
              content: literal.data,
              timestamp: new Date(literal.timestamp),
              author: literal.author,
              id: message.Replies.head.args[0]
            });
          }
          let tail = message.Replies.tail;
          while (typeof tail != "string") {
            const literal = Literal.fromUrl(tail.head.args[0]).get();
            replies.push({
              content: literal.data,
              timestamp: new Date(literal.timestamp),
              author: literal.author,
              id: tail.head.args[0]
            });
            tail = tail.tail;
          }
        }

        let editMessages = [{
          content: Literal.fromUrl(message.MessageExpr).get().data,
          timestamp: new Date(message.Timestamp),
          author: message.Author,
        }];

        if (typeof message.EditMessages != "string" && !message.EditMessages.variable) {
          if (message.EditMessages.head) {
            const literal = Literal.fromUrl(message.EditMessages.head.args[0]).get();
            editMessages.push({
              content: literal.data,
              timestamp: new Date(message.EditMessages.head.args[1].args[0]),
              author: literal.author,
            });
          }
          let tail = message.EditMessages.tail;
          while (typeof tail != "string") {
            const literal = Literal.fromUrl(tail.head.args[0]).get();
            editMessages.push({
              content: literal.data,
              timestamp: new Date(tail.head.args[1].args[0]),
              author: literal.author,
            });
            tail = tail.tail;
          }
        }

        let isNeighbourhoodCardHidden = typeof message.AllCardHidden != "string"  && !message.AllCardHidden.variable;

        cleanedLinks.push({
          id: message.MessageExpr,
          author: message.Author,
          content: Literal.fromUrl(message.MessageExpr).get().data,
          timestamp: new Date(message.Timestamp),
          reactions: reactions,
          replies: replies,
          isNeighbourhoodCardHidden,
          isPopular: message.IsPopular,
          editMessages: editMessages
        });
      }
    }

    const keyedMessages = cleanedLinks.reduce((acc, message) => {
      //@ts-ignore
      return { ...acc, [message.id]: message };
    }, {});

    console.log('expressionLinks', cleanedLinks)


    return {
      keyedMessages: keyedMessages,
      expressionLinkLength: expressionLinks.length,
    };
  } catch (e: any) {
    throw new Error(e);
  }
}
