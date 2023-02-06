import {
  BODY,
  REPLY_TO,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { EntryType } from "../../types";
import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
} from "@perspect3vism/ad4m";

@SDNAClass({
  through: ENTRY_TYPE,
  initial: EntryType.Message,
  required: true,
})
export class Message {
  @subjectProperty({
    through: BODY,
    resolve: true,
    resolveLanguage: "literal",
  })
  body: string;

  @subjectCollection({
    through: REPLY_TO,
  })
  replies: string[];
  addReply(reply: string) {}
}

export default Message;
