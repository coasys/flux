import { Literal } from "@perspect3vism/ad4m";
import { emoji, emojiCount } from "../constants/sdna";

export interface SDNAValues {
    emoji: string,
    emojiCount: number
}

export async function generateSDNALiteral(values?: SDNAValues): Promise<Literal> {
    if (!values) {
        values = {emoji, emojiCount};
    }

    if (values.emojiCount < 1) {
        throw new Error("Emoji count must be greater than 0");
    }
    const parsedEmoji = values.emoji.codePointAt(0);

    if (!parsedEmoji) {
        throw new Error("Could not parse code point for emoji in getSDNALiteral");
    }

    const parsedEmojiString = parsedEmoji.toString(16);

    return Literal.from(`
        emojiCount(Message, Count):- aggregate_all(count, link(Message, "flux://has_reaction", "emoji://${parsedEmojiString}", _, _), Count).

        isPopular(Message) :- emojiCount(Message, Count), Count >= ${values.emojiCount}.
        isNotPopular(Message) :- emojiCount(Message, Count), Count < ${values.emojiCount}.

        flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages):-
        link(Channel, "temp://directly_succeeded_by", Message, Timestamp, Author),
        findall((EditMessage, EditMessageTimestamp, EditMessageAuthor), link(Message, "temp://edited_to", EditMessage, EditMessageTimestamp, EditMessageAuthor), EditMessages),
        findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "flux://has_reaction", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
        findall((IsHidden, IsHiddenTimestamp, IsHiddenAuthor), link(Message, "flux://is_card_hidden", IsHidden, IsHiddenTimestamp, IsHiddenAuthor), AllCardHidden),
        findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "flux://has_reply", Message, ReplyTimestamp, ReplyAuthor), Replies).
        
        flux_message_query_popular(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, true):- 
        flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isPopular(Message).
        
        flux_message_query_popular(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, false):- 
        flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isNotPopular(Message).
    `);
}