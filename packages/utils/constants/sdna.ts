import { TITLE, BODY, REACTION, REPLY_TO, EDITED_TO, CARD_HIDDEN } from "../constants/communityPredicates";
import { EntryType } from "../types";

export const emojiCount = 3;
export const emoji = "1f44d";
export const DEFAULT_LIMIT = 50;
export const LATEST_SDNA_VERSION = 1;

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

    flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies):- 
        link(Source, "${EntryType.SimplePost}", Id, Timestamp, Author),
        findall((Title, TitleTimestamp, TitleAuthor), link(Id, "${TITLE}", Title, TitleTimestamp, TitleAuthor), Titles),
        findall((Body, BodyTimestamp, BodyAuthor), link(Id, "${BODY}", Body, BodyTimestamp, BodyAuthor), Bodys),
        findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Id, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
        findall((flux_post(Source, Reply, Timestamp, Author, Titles, Bodys, Reactions)), link(Reply, "${REPLY_TO}", Id, ReplyTimestamp, ReplyAuthor), Replies).
    
    flux_post_query_popular(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, true) :-
        flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies), isPopular(Id).

    flux_post_query_popular(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, false) :-
        flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies), isNotPopular(Id).`;

export const messageFilteredQuery = `limit(%%, (order_by([desc(Timestamp)], flux_message_query_popular("%%", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp =< %%)).`;
export const messageQuery = `limit(%%, order_by([desc(Timestamp)], flux_message_query_popular("%%", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular))).`;

export const forumFilteredQuery = `limit(%%, (order_by([desc(Timestamp)], flux_post_query_popular("%%", Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, IsPopular)), Timestamp =< %%)).`;
export const forumQuery = `limit(%%, order_by([desc(Timestamp)], flux_post_query_popular("%%", Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, IsPopular))).`;