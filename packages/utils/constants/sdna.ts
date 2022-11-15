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
} from "../constants/communityPredicates";
import { EntryType } from "../types";

export const emojiCount = 3;
export const emoji = "1f44d";
export const DEFAULT_LIMIT = 50;

export const LATEST_SDNA_VERSION = 7;
export const SDNA_CREATION_DATE = new Date("2022-11-13T23:51:33Z");

//Note: in the prolog queries below, the %% values are to be string templated before use

export const SDNA = `
    emojiCount(Message, Count):- 
        aggregate_all(count, link(Message, "${REACTION}", "emoji://%%", _, _), Count).

    isPopular(Message) :- emojiCount(Message, Count), Count >= %%.
    isNotPopular(Message) :- emojiCount(Message, Count), Count < %%.

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

    flux_post(Source, Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies):- 
        link(Source, "${EntryType.ImagePost}", Id, Timestamp, Author),
        findall((Title, TitleTimestamp, TitleAuthor), link(Id, "${TITLE}", Title, TitleTimestamp, TitleAuthor), Title),
        findall((Body, BodyTimestamp, BodyAuthor), link(Id, "${BODY}", Body, BodyTimestamp, BodyAuthor), Body),
        findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Id, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
        findall((Url, UrlTimestamp, UrlAuthor), link(Id, "${URL}", Url, UrlTimestamp, UrlAuthor), Url),
        findall((Image, ImageTimestamp, ImageAuthor), link(Id, "${IMAGE}", Image, ImageTimestamp, ImageAuthor), Image),
        findall((StartDate, StartDateTimestamp, StartDateAuthor), link(Id, "${START_DATE}", StartDate, StartDateTimestamp, StartDateAuthor), StartDate),
        findall((EndDate, EndDateTimestamp, EndDateAuthor), link(Id, "${END_DATE}", EndDate, EndDateTimestamp, EndDateAuthor), EndDate),
        findall((Type, TypeTimestamp, TypeAuthor), link(Id, "${ENTRY_TYPE}", Type, TypeTimestamp, TypeAuthor), Types),
        findall((flux_post(Source, Reply, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies)), link(Reply, "${REPLY_TO}", Id, ReplyTimestamp, ReplyAuthor), Replies).
    
    flux_post_query_popular(Source, Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies, true) :-
        flux_post(Source, Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies), isPopular(Id).

    flux_post_query_popular(Source, Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies, false) :-
        flux_post(Source, Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies), isNotPopular(Id).`;

export const messageFilteredQuery = `limit(%%, (order_by([desc(Timestamp)], flux_message_query_popular("%%", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp =< %%)).`;
export const messageQuery = `limit(%%, order_by([desc(Timestamp)], flux_message_query_popular("%%", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular))).`;

export const forumFilteredQuery = `limit(%%, (order_by([desc(Timestamp)], flux_post_query_popular("%%", Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies, IsPopular)), Timestamp =< %%)).`;
export const forumQuery = `limit(%%, order_by([desc(Timestamp)], flux_post_query_popular("%%", Id, Timestamp, Author, Title, Body, Reactions, Url, Image, StartDate, EndDate, Types, Replies, IsPopular))).`;
