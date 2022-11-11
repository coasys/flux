import { Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { MAX_MESSAGES } from "../constants/general";
import { Message, Reaction } from "../types";
import extractPrologResults from "../helpers/extractPrologResults";

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
    const client = await getAd4mClient();
    
    let expressionLinks;
    if (from) {
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

    const cleanedResults = extractPrologResults(expressionLinks, ["Reactions", "Replies", "EditMessages", "MessageExpr", "Author", "Timestamp", "AllCardHidden", "IsPopular"]);
    const cleanedMessages: Message[] = [];

    cleanedResults.forEach((result: any) => {
      const expressionData = Literal.fromUrl(result.MessageExpr).get().data;
      result.EditMessages.push({
          content: expressionData,
          timestamp: new Date(result.Timestamp),
          author: result.Author,
      });
      result.Reactions.forEach(reaction => {
        reaction.content = reaction.content.replace('emoji://', '');
      });
      result.Replies.forEach(reply => {
        reply.content = Literal.fromUrl(reply.content).get().data;
      });
      cleanedMessages.push({
        id: result.MessageExpr,
        author: result.Author,
        content: expressionData,
        timestamp: new Date(result.Timestamp),
        reactions: result.Reactions,
        replies: result.Replies,
        isNeighbourhoodCardHidden: result.AllCardHidden !== undefined,
        isPopular: result.IsPopular,
        editMessages: result.EditMessages
      });
    });

    const keyedMessages = cleanedMessages.reduce((acc, message) => {
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
