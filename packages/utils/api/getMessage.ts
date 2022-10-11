import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { Message } from "../types";
import retry from "../helpers/retry";
import { REPLY_TO } from "../constants/ad4m";

export interface Payload {
  perspectiveUuid: string;
  link: LinkExpression;
}



export default function (link: LinkExpression): Message {
  try {
    const expression = Literal.fromUrl(link.data.target).get();

    let reply;

    if (link.data.predicate === REPLY_TO) {
      const expression = Literal.fromUrl(link.data.source).get();
      reply = {
        id: link.data.source,
        timestamp: expression.timestamp,
        url: link.data.source,
        author: expression.author,
        reactions: [],
        replies: [],
        content: expression.data,
      };
    }

    const message = {
      id: link.data.target,
      timestamp: expression.timestamp,
      url: link.data.target,
      author: link.author,
      reactions: [],
      replies: [reply],
      content: expression.data,
    };

    return message as Message;
  } catch (e: any) {
    throw new Error(e);
  }
}
