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
  subjectFlag,
} from "@perspect3vism/ad4m";

@SDNAClass({
  name: 'Message'
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
    through: REPLY_TO,
  })
  replies: string[] = [];
}

export default Message;
