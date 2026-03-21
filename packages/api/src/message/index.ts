import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { Model, Property, HasMany, Flag, Ad4mModel } from '@coasys/ad4m';

const { BODY, HAS_REPLY, ENTRY_TYPE, REACTION, TRANSCRIPT_STARTED_AT, MESSAGE_THREAD } = community;

@Model({ name: 'Message' })
export class Message extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Message })
  type: string;

  @Property({ through: BODY })
  body: string;

  @Property({ through: TRANSCRIPT_STARTED_AT })
  transcriptStartedAt?: string;

  @HasMany({ through: REACTION })
  reactions: string[] = [];

  @Property({
    through: HAS_REPLY,
    getter: `(<-link[WHERE predicate = '${HAS_REPLY}'].in.uri)[0]`,
  })
  replyingTo?: string;

  @Property({
    through: 'flux://is_popular',
    getter: `count(<-link[WHERE predicate = '${REACTION}' AND out.uri = 'emoji://1f44d']) > 5`,
    readOnly: true,
  })
  isPopular: boolean = false;

  @HasMany({ through: MESSAGE_THREAD })
  thread: string[] = [];

  @HasMany({ through: HAS_REPLY })
  replies: string[] = [];
}

export default Message;
