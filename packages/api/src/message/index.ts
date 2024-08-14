import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  SDNAClass,
  SubjectProperty,
  SubjectCollection,
  SubjectFlag,
} from "@coasys/ad4m";

const { BODY, REPLY_TO, ENTRY_TYPE, REACTION } = community;

@SDNAClass({
  name: "Message",
})
export class Message {
  @SubjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Message,
  })
  type: string;

  @SubjectProperty({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @SubjectCollection({
    through: REACTION,
  })
  reactions: string[] = [];

  @SubjectProperty({
    getter: `triple(Reply, "${REPLY_TO}", Base), Value = Reply`,
  })
  replyingTo: string | undefined = "";

  @SubjectProperty({
    getter: `findall(Base, triple(Base, "flux://has_reaction", "emoji://1f44d"), List),
    (length(List, Length), Length > 5 -> Value = true ; Value = false)`,
  })
  isPopular: boolean = false;

  @SubjectCollection({
    through: "ad4m://has_child",
    where: {
      condition: `subject_class("Message", Class), instance(Class, Target)`,
    },
  })
  thread: string[] = [];

  @SubjectCollection({
    through: REPLY_TO,
  })
  replies: string[] = [];

  @SubjectCollection({
    through: "ad4m://embeding",
  })
  embedding: number[] = []
}

export default Message;
