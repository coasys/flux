import { Literal } from "@perspect3vism/ad4m";
import { emoji, emojiCount, SDNA } from "../constants/sdna";
import format from "../helpers/formatString";

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

    const templatedSDNA = format(SDNA, parsedEmojiString, emojiCount, emojiCount);

    return Literal.from(templatedSDNA);
}