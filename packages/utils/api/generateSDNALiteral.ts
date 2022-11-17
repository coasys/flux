import { Literal } from "@perspect3vism/ad4m";
import { emoji, emojiCount, SDNA } from "../constants/sdna";
import format, { getPrologQuery } from "../helpers/formatString";

export interface SDNAValues {
  emoji: string;
  emojiCount: number;
}

export async function generateSDNALiteral(
  values?: SDNAValues
): Promise<Literal> {
  let emojiInput;
  let emojiCountInput;
  if (!values) {
    emojiInput = emoji;
    emojiCountInput = emojiCount;
  } else {
    if (values.emojiCount < 1) {
      throw new Error("Emoji count must be greater than 0");
    }
    emojiCountInput = values.emojiCount;

    emojiInput = values.emoji.codePointAt(0);

    if (!emojiInput) {
      throw new Error("Could not parse code point for emoji in getSDNALiteral");
    }

    emojiInput = emojiInput.toString(16);
  }

  const templatedSDNA = getPrologQuery(SDNA, {
    emoji: emojiInput,
    emojiCount: emojiCountInput,
  });

  return Literal.from(templatedSDNA);
}
