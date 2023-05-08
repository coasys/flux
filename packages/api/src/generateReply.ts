import { Message } from "@fluxapp/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { Expression, Literal } from "@perspect3vism/ad4m";

export default async function (
  data: string,
  replyUrl: string
): Promise<{ message: Message; literal: Expression }> {
  const client = await getAd4mClient();
  const literal = await client.expression.create(data, "literal");
  const expression = Literal.fromUrl(literal).get();

  const replyExpression = Literal.fromUrl(replyUrl).get();
  const reply = {
    id: replyUrl,
    timestamp: replyExpression.timestamp,
    url: replyUrl,
    author: replyExpression.author,
    reactions: [],
    replies: [],
    content: replyExpression.data,
  };

  const message = {
    id: literal,
    timestamp: expression.timestamp,
    url: literal,
    author: expression.author,
    reactions: [],
    replies: [reply],
    content: expression.data,
    editMessages: [
      {
        author: expression.author,
        content: expression.data,
        timestamp: expression.timestamp,
      },
    ],
    synced: false,
    isPopular: false,
    isNeighbourhoodCardHidden: false,
  } as Message;
  return { message, literal };
}
