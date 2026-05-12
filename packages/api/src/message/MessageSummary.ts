import { Ad4mModel, Flag, HasMany, Model, Property } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';

const { BODY, ENTRY_TYPE, REACTION, TRANSCRIPT_STARTED_AT, MESSAGE_THREAD, HAS_REPLY } = community;

/**
 * Lightweight Message for list rendering.
 *
 * No SPARQL getters — `replyingTo` and `isPopular` are omitted entirely.
 * Use `Message.evaluateGetters()` on the full model to lazily resolve
 * getter-backed properties for visible items only.
 *
 * Retains simple @HasMany relations (reactions, thread, replies) since
 * those are direct link traversals, not SPARQL queries.
 */
@Model({ name: 'Message' })
export class MessageSummary extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Message })
  type: string;

  @Property({ through: BODY })
  body: string;

  @Property({ through: TRANSCRIPT_STARTED_AT })
  transcriptStartedAt?: string;

  @HasMany({ through: REACTION })
  reactions: string[] = [];

  @HasMany({ through: MESSAGE_THREAD })
  thread: string[] = [];

  @HasMany({ through: HAS_REPLY })
  replies: string[] = [];
}

export default MessageSummary;
