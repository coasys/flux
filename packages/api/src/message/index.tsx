import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
  subjectFlag,
} from "@coasys/ad4m";

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

  @subjectProperty({
    getter: `triple(Reply, "${REPLY_TO}", Base), Value = Reply`,
  })
  replyingTo: string | undefined = "";

  @subjectProperty({
    getter: `findall(Base, triple(Base, "flux://has_reaction", "emoji://1f44d"), List), 
    (length(List, Length), Length > 5 -> Value = true ; Value = false)`,
  })
  isPopular: boolean = false;

  @subjectCollection({
    through: "ad4m://has_child",
    where: {
      condition: `subject_class("Message", Class), instance(Class, Target)`,
    },
  })
  thread: string[] = [];

  @subjectCollection({
    through: REPLY_TO,
  })
  replies: string[] = [];
}

export default Message;
