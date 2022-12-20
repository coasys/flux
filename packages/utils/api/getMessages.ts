import { Literal } from "@perspect3vism/ad4m";
import { Message } from "../types";
import { extractPrologResults } from "../helpers/prologHelpers";
import {
  DEFAULT_LIMIT,
  messageFilteredQuery,
  messageQuery,
  messageFilteredQueryBackwards,
} from "../constants/sdna";
import { getPrologQuery } from "../helpers/formatString";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { checkUpdateSDNAVersion } from "./updateSDNA";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  from?: Date;
  backwards?: boolean;
}

export default async function ({
  perspectiveUuid,
  channelId,
  from,
  backwards,
}: Payload) {
  const client = await getAd4mClient();

  let prologQuery;
  if (from && backwards) {
    prologQuery = getPrologQuery(messageFilteredQueryBackwards, {
      source: channelId,
      fromDate: from ? from.getTime() : null,
    });
  } else if (from) {
    prologQuery = getPrologQuery(messageFilteredQuery, {
      limit: DEFAULT_LIMIT,
      source: channelId,
      fromDate: from ? from.getTime() : null,
    });
  } else {
    prologQuery = getPrologQuery(messageQuery, {
      limit: DEFAULT_LIMIT,
      source: channelId,
      fromDate: from ? from.getTime() : null,
    });
  }

  const expressionLinks = await client.perspective.queryProlog(
    perspectiveUuid,
    prologQuery
  );
  const cleanedResults = extractPrologResults(expressionLinks, [
    "Reactions",
    "Replies",
    "EditMessages",
    "Message",
    "Author",
    "Timestamp",
    "AllCardHidden",
    "IsPopular",
  ]);
  const cleanedMessages: Message[] = [];

  cleanedResults.forEach((result: any) => {
    console.log(result);
    //Parse out the message content
    result.EditMessages.forEach(message => {
      message.content = Literal.fromUrl(message.content).get().data;
    })
    result.Message.replace("%3A", ":");
    //Parse the original message data and add it to the edit messages
    const expressionData = Literal.fromUrl(result.Message).get().data;
    result.EditMessages.unshift({
      content: expressionData,
      timestamp: new Date(result.Timestamp),
      author: result.Author,
    });
    //Parse out the emojis
    result.Reactions.forEach((reaction) => {
      reaction.content = reaction.content.replace("emoji://", "");
    });
    //Parse out the replies
    result.Replies.forEach((reply) => {
      const literal = Literal.fromUrl(reply.content).get();
      reply.id = reply.content;
      reply.timestamp = literal.timestamp;
      reply.content = literal.data;
    });
    cleanedMessages.push({
      id: result.Message,
      author: result.Author,
      content: expressionData,
      timestamp: new Date(result.Timestamp),
      reactions: result.Reactions,
      replies: result.Replies,
      isNeighbourhoodCardHidden: result.AllCardHidden.length > 0,
      isPopular: result.IsPopular,
      editMessages: result.EditMessages,
      synced: true,
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
