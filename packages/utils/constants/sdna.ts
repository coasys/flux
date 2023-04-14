import {
  TITLE,
  BODY,
  REACTION,
  REPLY_TO,
  EDITED_TO,
  CARD_HIDDEN,
  URL,
  IMAGE,
  START_DATE,
  END_DATE,
  ENTRY_TYPE,
  CHANNEL_NAME,
  CHANNEL_VIEW,
} from "../constants/communityPredicates";
import { EntryType } from "../types";

export const emojiCount = 3;
export const emoji = "1f44d";
export const DEFAULT_LIMIT = 50;

export const LATEST_SDNA_VERSION = 8;
export const SDNA_CREATION_DATE = new Date("2022-11-18T17:22:56Z");

//Note: in the prolog queries below, the $ values are to be string templated before use

export const SDNA = `
    emojiCount(Message, Count):- 
        aggregate_all(count, link(Message, "${REACTION}", "emoji://$emoji", _, _), Count).

    isPopular(Message) :- emojiCount(Message, Count), Count >= $emojiCount.
    isNotPopular(Message) :- emojiCount(Message, Count), Count < $emojiCount.

    flux_message(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages):-
        link(Source, "${EntryType.Message}", Message, Timestamp, Author),
        findall((EditMessage, EditMessageTimestamp, EditMessageAuthor), link(Message, "${EDITED_TO}", EditMessage, EditMessageTimestamp, EditMessageAuthor), EditMessages),
        findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
        findall((IsHidden, IsHiddenTimestamp, IsHiddenAuthor), link(Message, "${CARD_HIDDEN}", IsHidden, IsHiddenTimestamp, IsHiddenAuthor), AllCardHidden),
        findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "${REPLY_TO}", Message, ReplyTimestamp, ReplyAuthor), Replies).
    
    flux_message_query_popular(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, true):- 
        flux_message(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isPopular(Message).
    
    flux_message_query_popular(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, false):- 
        flux_message(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isNotPopular(Message). 

`;

export const messageFilteredQuery = `limit($limit, (order_by([desc(Timestamp)], flux_message_query_popular("$source", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp =< $fromDate)).`;
export const messageFilteredQueryBackwards = `(order_by([asc(Timestamp)], flux_message_query_popular("$source", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp >= $fromDate).`;
export const messageQuery = `limit($limit, order_by([desc(Timestamp)], flux_message_query_popular("$source", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular))).`;
