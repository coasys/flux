import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { Model, Property, HasMany, Flag, Ad4mModel } from '@coasys/ad4m';

const { BODY, HAS_REPLY, ENTRY_TYPE, REACTION, TRANSCRIPT_STARTED_AT, MESSAGE_THREAD } = community;

@Model({ name: 'Message' })
export class Message extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Message })
  type: string;

  // Message bodies are stored as signed-envelope literals rather than
  // deterministic typed literals — per-message provenance matters for
  // moderation, edit-history and cross-agent trust chains, and message text
  // often contains rich content (JSON payloads, formatted markdown) that we
  // want the envelope's `.data` field to unwrap on read.
  //
  // All other scalar `@Property` fields in this package (channel names,
  // titles, task names, transcript timestamps, topic names, etc.) use the
  // default deterministic typed-literal storage and are read directly from
  // SPARQL bindings without `parseLit()`.
  @Property({ through: BODY, resolveLanguage: 'literal' })
  body: string;

  @Property({ through: TRANSCRIPT_STARTED_AT })
  transcriptStartedAt?: string;

  @HasMany({ through: REACTION })
  reactions: string[] = [];

  @Property({
    through: HAS_REPLY,
    getter: `SELECT ?target WHERE { ?target <${HAS_REPLY}> ?source . } LIMIT 1`,
  })
  replyingTo?: string;

  @Property({
    through: 'flux://is_popular',
    getter: `ASK WHERE { SELECT (COUNT(DISTINCT ?reactor) AS ?count) WHERE { ?reactor <${REACTION}> ?source . FILTER(?reactor = <emoji://1f44d>) } HAVING(?count > 5) }`,
    readOnly: true,
  })
  isPopular: boolean = false;

  @HasMany({ through: MESSAGE_THREAD })
  thread: string[] = [];

  @HasMany({ through: HAS_REPLY })
  replies: string[] = [];
}

export default Message;
