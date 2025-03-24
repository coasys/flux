import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { ModelOptions, Property, Collection, Flag, Ad4mModel } from "@coasys/ad4m";

const { BODY, REPLY_TO, ENTRY_TYPE, REACTION } = community;

@ModelOptions({
  name: "Message",
})
export class Message extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.Message,
  })
  type: string;

  @Property({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @Collection({
    through: REACTION,
  })
  reactions: string[] = [];

  @Property({
    getter: `triple(Reply, "${REPLY_TO}", Base), Value = Reply`,
  })
  replyingTo: string | undefined = "";

  @Property({
    getter: `findall(Base, triple(Base, "flux://has_reaction", "emoji://1f44d"), List),
    (length(List, Length), Length > 5 -> Value = true ; Value = false)`,
  })
  isPopular: boolean = false;

  @Collection({
    through: "ad4m://has_child",
    where: {
      condition: `subject_class("Message", Class), instance(Class, Target)`,
    },
  })
  thread: string[] = [];

  @Collection({
    through: REPLY_TO,
  })
  replies: string[] = [];
}

export default Message;
