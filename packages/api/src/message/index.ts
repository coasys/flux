import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { ModelOptions, Property, Optional, Collection, Flag, Ad4mModel, ReadOnly } from '@coasys/ad4m';

const { BODY, HAS_REPLY, ENTRY_TYPE, REACTION, TRANSCRIPT_STARTED_AT } = community;

@ModelOptions({
  name: 'Message',
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
    resolveLanguage: 'literal',
  })
  body: string;

  @Optional({
    through: TRANSCRIPT_STARTED_AT,
    writable: true,
    resolveLanguage: 'literal',
  })
  transcriptStartedAt?: string;

  @Collection({
    through: REACTION,
  })
  reactions: string[] = [];

  @Optional({
    through: HAS_REPLY,
    surrealGetter: `(<-link[WHERE perspective = $perspective AND predicate = '${HAS_REPLY}'].in.uri)[0]`,
  })
  replyingTo: string | undefined = '';

  @ReadOnly({
    getter: `findall(Base, triple(Base, "flux://has_reaction", "emoji://1f44d"), List),
    (length(List, Length), Length > 5 -> Value = true ; Value = false)`,
  })
  isPopular: boolean = false;

  @Collection({
    through: 'ad4m://has_child',
    where: { isInstance: 'Message' },
  })
  thread: string[] = [];

  @Collection({
    through: HAS_REPLY,
  })
  replies: string[] = [];
}

export default Message;
