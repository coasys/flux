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

  @subjectProperty({
    getter: `triple(Reply, "${REPLY_TO}", Base), Value = Reply`,
  })
  replyingTo: string | undefined = "";

  @subjectProperty({
    getter: `triple(Base, "flux://has_reaction", "emoji://1f44d"), Value = true ; Value = false)`,
  })
  isPopular: boolean = false;

  @subjectCollection({
    through: "rdf://has_child",
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
