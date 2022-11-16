import { Literal } from "@perspect3vism/ad4m";
import { Message } from "../types";
import extractPrologResults from "../helpers/extractPrologResults";
import { DEFAULT_LIMIT, messageFilteredQuery, messageFilteredQueryBackwards, messageQuery } from "../constants/sdna";
import format from "../helpers/formatString";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { checkUpdateSDNAVersion } from "./updateSDNA";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  from?: Date;
  backwards?: boolean
}

export default async function ({ perspectiveUuid, channelId, from, backwards }: Payload) {
  console.warn("Getting messages...");
  const client = await getAd4mClient();

  let prologQuery;
  if (from && backwards) {
    prologQuery = messageFilteredQueryBackwards;
    prologQuery = format(prologQuery, DEFAULT_LIMIT, channelId, from!.getTime());
  } else if (from) {
      prologQuery = messageFilteredQuery;
      prologQuery = format(prologQuery, DEFAULT_LIMIT, channelId, from!.getTime());
  } else {
      prologQuery = messageQuery
      prologQuery = format(prologQuery, DEFAULT_LIMIT, channelId);
  }

  const expressionLinks = await client.perspective.queryProlog(perspectiveUuid, prologQuery);
  const cleanedResults = extractPrologResults(expressionLinks, ["Reactions", "Replies", "EditMessages", "Message", "Author", "Timestamp", "AllCardHidden", "IsPopular"]);
  const cleanedMessages: Message[] = [];

  cleanedResults.forEach((result: any) => {
    const expressionData = Literal.fromUrl(result.Message).get().data;
    result.EditMessages.push({
        content: expressionData,
        timestamp: new Date(result.Timestamp),
        author: result.Author,
    });
    result.Reactions.forEach(reaction => {
      reaction.content = reaction.content.replace('emoji://', '');
    });
    result.Replies.forEach(reply => {
      reply.id = reply.content;
      reply.content = Literal.fromUrl(reply.content).get().data;
    });
    cleanedMessages.push({
      id: result.Message,
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
  if (cleanedMessages.length > 0) {
    //@ts-ignore
    checkUpdateSDNAVersion(perspectiveUuid, cleanedMessages[0].timestamp);
  }

  const keyedMessages = cleanedMessages.reduce((acc, message) => {
    //@ts-ignore
    return { ...acc, [message.id]: message };
  }, {});

  return {
    keyedMessages: keyedMessages,
    expressionLinkLength: expressionLinks.length,
  };
}
