import { community } from "@fluxapp/constants";
import { EntryType } from "@fluxapp/types";
import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
  subjectFlag,
} from "@perspect3vism/ad4m";

const { BODY, REPLY_TO, ENTRY_TYPE, REACTION } = community;

@SDNAClass({
  name: "Message",
})
export class Message {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Message,
  })
  type: string;

  @subjectProperty({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @subjectCollection({
    through: REACTION,
  })
  reactions: string[] = [];

  @subjectCollection({
    through: REPLY_TO,
  })
  replies: string[] = [];
}

export default Message;
