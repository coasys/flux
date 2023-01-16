import {
  BODY,
  REPLY_TO,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { EntryType } from "../../types";
import { sdnaOutput, subjectProperty, subjectPropertySetter, subjectCollection } from "@perspect3vism/ad4m";

export class Message {
  @subjectProperty({
    through: ENTRY_TYPE, 
    initial: EntryType.Message,
    required: true,
  })
  type: string;

  @subjectProperty({
    through: BODY,
    resolve: true,
  })
  body: string;

  @subjectPropertySetter({
    resolveLanguage: 'literal'
  })
  setBody(body: string) {}
  
  @subjectCollection({
    through: REPLY_TO,
  })
  replies: string[];
  addReply(reply: string) {}

  @sdnaOutput
  static generateSdna(): string { return "" }
}
