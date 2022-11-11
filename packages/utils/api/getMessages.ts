import { Literal } from "@perspect3vism/ad4m";
import { Message } from "../types";
import extractPrologResults from "../helpers/extractPrologResults";
import { DEFAULT_LIMIT, messageFilteredQuery, messageQuery } from "../constants/sdna";
import format from "../helpers/formatString";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  from?: Date;
}

export default async function ({ perspectiveUuid, channelId, from }: Payload) {
  const client = await getAd4mClient();

  let prologQuery;
  if (from) {
      prologQuery = messageFilteredQuery;
  } else {
      prologQuery = messageQuery
  }
  prologQuery = format(prologQuery, [DEFAULT_LIMIT, channelId, from?.getTime()]);

  const expressionLinks = await client.perspective.queryProlog(perspectiveUuid, prologQuery);
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
}
