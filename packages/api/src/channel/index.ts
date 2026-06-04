import { Ad4mModel, HasMany, HasManyMethods, Flag, Literal, LinkQuery, Model, Property, PerspectiveProxy, parseLit, parseSparqlCount, CountBinding } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { SynergyGroup, SynergyItem, ItemType, icons } from '@coasys/flux-utils';
import App from '../app';
import Conversation from '../conversation';
import Message from '../message';
import Post from '../post';
import Task from '../task';
import TaskBoard from '../task-board';
import TaskColumn from '../task-column';

const {
  ENTRY_TYPE,
  CHANNEL_NAME,
  CHANNEL_DESCRIPTION,
  CHANNEL_IS_CONVERSATION,
  CHANNEL_IS_PINNED,
  FLUX_PARTICIPANT,
  SUBGROUP_ITEM,
} = community;

// ---------------------------------------------------------------------------
// SPARQL binding shapes — typed via `querySparql<T>()` so call sites lose the
// `binding: any` annotations and gain compile-time field checks.
// ---------------------------------------------------------------------------

interface IdBinding {
  id: string;
}

interface ChannelItemBinding {
  id: string;
  author: string;
  timestamp: string;
  type: string;
  body?: string;
  title?: string;
  taskName?: string;
  transcriptStart?: string;
}

interface RecentConversationBinding {
  channelId: string;
  isConv: string;
  conversationId?: string;
}

interface PinnedConversationBinding {
  channelId: string;
  conversationId?: string;
}

@Model({ name: 'Channel' })
export class Channel extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Channel })
  type: string;

  @Property({ through: CHANNEL_NAME })
  name: string;

  @Property({ through: CHANNEL_DESCRIPTION })
  description: string;

  @Property({ through: CHANNEL_IS_CONVERSATION })
  isConversation: boolean;

  @Property({ through: CHANNEL_IS_PINNED })
  isPinned: boolean;

  @HasMany(() => App)
  views: App[] = [];

  @HasMany({ through: FLUX_PARTICIPANT })
  participants: string[] = [];

  @HasMany(() => Message)
  messages: Message[] = [];

  @HasMany(() => Conversation)
  conversations: Conversation[] = [];

  @HasMany(() => Channel)
  childChannels: Channel[] = [];

  @HasMany(() => TaskBoard)
  boards: TaskBoard[] = [];

  @HasMany(() => TaskColumn)
  taskColumns: TaskColumn[] = [];

  @HasMany(() => Task)
  tasks: Task[] = [];

  @HasMany(() => Post)
  posts: Post[] = [];

  async allItems(): Promise<SynergyItem[]> {
    // Get all items (messages, posts, tasks) in the channel
    try {
      const sparqlQuery = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?id ?author ?timestamp ?type ?body ?title ?taskName ?transcriptStart WHERE {
          <${this.id}> <ad4m://has_child> ?id .
          ?_reifier rdf:reifies <<( <${this.id}> <ad4m://has_child> ?id )>> .
          ?_reifier <ad4m://ontology/timestamp> ?timestamp .
          ?_reifier <ad4m://ontology/author> ?author .
          ?id <flux://entry_type> ?type .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          OPTIONAL { ?id <flux://body> ?body . }
          OPTIONAL { ?id <flux://title> ?title . }
          OPTIONAL { ?id <flux://name> ?taskName . }
          OPTIONAL { ?id <flux://transcript_started_at> ?transcriptStart . }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql<ChannelItemBinding[]>(sparqlQuery);

      const mapped = (sparqlResult || []).map((binding) => {
        let text = '';
        let type: ItemType = 'Message';
        const itemType = binding.type;

        if (itemType === 'flux://has_message') {
          text = parseLit(binding.body);
          type = 'Message';
        } else if (itemType === 'flux://has_post') {
          text = parseLit(binding.title);
          type = 'Post';
        } else if (itemType === 'flux://has_task') {
          text = parseLit(binding.taskName);
          type = 'Task';
        }

        return {
          id: binding.id,
          author: binding.author,
          timestamp: new Date(parseLit(binding.transcriptStart) || binding.timestamp).toISOString(),
          text,
          type,
          icon: icons[type] || 'question',
        };
      });
      // Re-sort by effective timestamp since transcriptStart may differ from link timestamp
      return mapped.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } catch (error) {
      console.error('Error getting all channel items:', error);
      return [];
    }
  }

  async unprocessedItems(): Promise<SynergyItem[]> {
    // Get all unprocessed items in the channel using set-difference approach
    // instead of FILTER NOT EXISTS (which is O(N²) in Oxigraph)
    try {
      // Query 1: Get all item IDs in channel
      const allItemsQuery = `
        SELECT ?id WHERE {
          <${this.id}> <ad4m://has_child> ?id .
          ?id <flux://entry_type> ?type .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
        }
      `;

      // Query 2: Get all item IDs that have been placed into ANY conversation subgroup.
      // NOTE: We do NOT scope this through the channel because subgroups are
      // *grandchildren* of channels (channel → conversation → subgroup), not
      // direct children.  The previous channel-scoped query assumed
      //   channel --has_child--> subgroup
      // which never matched, so processedSet was always empty and every item
      // appeared unprocessed on every poll.  Scoping globally is correct
      // because items are unique to channels anyway.
      const processedQuery = `
        SELECT ?id WHERE {
          ?sg <${SUBGROUP_ITEM}> ?id .
          ?sg <flux://entry_type> <flux://conversation_subgroup> .
        }
      `;

      // NOTE: Race window — links added between these two queries could cause
      // an item to appear in allItems but not processedSet (or vice-versa).
      // The final VALUES query re-verifies channel membership to mitigate this.
      const [allItemsResult, processedResult] = await Promise.all([
        this.perspective.querySparql<IdBinding[]>(allItemsQuery),
        this.perspective.querySparql<IdBinding[]>(processedQuery),
      ]);

      const processedSet = new Set((processedResult || []).map((r) => r.id));
      const unprocessedIds = (allItemsResult || [])
        .map((r) => r.id)
        .filter((id) => id && !processedSet.has(id));

      if (unprocessedIds.length === 0) return [];

      // Query 3: Get full data only for unprocessed items using VALUES clause
      const valuesClause = unprocessedIds.map((id: string) => `<${id}>`).join(' ');
      const dataQuery = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?id ?author ?timestamp ?type ?body ?title ?taskName ?transcriptStart WHERE {
          VALUES ?id { ${valuesClause} }
          <${this.id}> <ad4m://has_child> ?id .
          ?_reifier rdf:reifies <<( <${this.id}> <ad4m://has_child> ?id )>> .
          ?_reifier <ad4m://ontology/author> ?author .
          ?_reifier <ad4m://ontology/timestamp> ?timestamp .
          ?id <flux://entry_type> ?type .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          OPTIONAL { ?id <flux://body> ?body . }
          OPTIONAL { ?id <flux://title> ?title . }
          OPTIONAL { ?id <flux://name> ?taskName . }
          OPTIONAL { ?id <flux://transcript_started_at> ?transcriptStart . }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql<ChannelItemBinding[]>(dataQuery);

      // Deduplicate by id
      const itemMap = new Map<string, ChannelItemBinding>();
      for (const binding of sparqlResult || []) {
        const id = binding.id;
        if (!id || itemMap.has(id)) continue;
        itemMap.set(id, binding);
      }

      const mapped = Array.from(itemMap.values()).map((binding) => {
        let text = '';
        let type: ItemType = 'Message';
        const itemType = binding.type;

        if (itemType === 'flux://has_message') {
          text = parseLit(binding.body);
          type = 'Message';
        } else if (itemType === 'flux://has_post') {
          text = parseLit(binding.title);
          type = 'Post';
        } else if (itemType === 'flux://has_task') {
          text = parseLit(binding.taskName);
          type = 'Task';
        }

        return {
          id: binding.id,
          author: binding.author,
          timestamp: new Date(parseLit(binding.transcriptStart) || binding.timestamp).toISOString(),
          text,
          type,
          icon: icons[type] || 'question',
        };
      });
      // Re-sort by effective timestamp since transcriptStart may differ from link timestamp
      return mapped.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } catch (error) {
      console.error('Error getting channel items:', error);
      return [];
    }
  }

  async totalItemCount(): Promise<number> {
    // Find the total number of items in the channel
    try {
      // SPARQL migration
      const sparqlQuery = `
        SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE {
          <${this.id}> <ad4m://has_child> ?id .
          ?id <flux://entry_type> ?type .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
        }
      `;

      const sparqlResult = await this.perspective.querySparql<CountBinding[]>(sparqlQuery);
      return parseSparqlCount(sparqlResult);
    } catch (error) {
      console.error('Error getting total item count:', error);
      return 0;
    }
  }

  /**
   * Get recent conversation channels with last-activity timestamps.
   *
   * Uses a lightweight SPARQL query (no reifier joins) to find conversation
   * channels, then the native link API to get timestamps — avoiding the
   * expensive triple-term pattern matching that caused 60s query times.
   *
   * Returns conversation channels ordered by most recent activity (latest item timestamp).
   * Falls back to channel creation time when no items exist.
   */
  static async recentConversations(
    perspective: PerspectiveProxy,
    limit: number = 20,
  ): Promise<{ channelId: string; conversationId?: string; lastActivity?: string }[]> {
    // Step 1: Find conversation channels + their conversation child (fast, no reifier joins)
    const sparql = `
      SELECT ?channelId ?isConv ?conversationId WHERE {
        ?channelId <${ENTRY_TYPE}> <${EntryType.Channel}> .
        ?channelId <${CHANNEL_IS_CONVERSATION}> ?isConv .
        OPTIONAL {
          ?channelId <ad4m://has_child> ?conversationId .
          ?conversationId <${ENTRY_TYPE}> <flux://conversation> .
        }
      }
    `;

    try {
      const results = await perspective.querySparql<RecentConversationBinding[]>(sparql);

      // Filter to only conversation channels and dedup
      const channelMap = new Map<string, { channelId: string; conversationId?: string; lastActivity?: string }>();
      for (const r of results || []) {
        const cid = r.channelId;
        if (!cid || channelMap.has(cid)) continue;
        const parsed = parseLit(r.isConv);
        if (String(parsed) !== 'true') continue;
        channelMap.set(cid, {
          channelId: cid,
          conversationId: r.conversationId || undefined,
        });
      }

      if (channelMap.size === 0) return [];

      // Step 2: For each channel, get has_child links via native API to find latest timestamp.
      // perspective.get() uses indexed lookups, not SPARQL reifier joins.
      await Promise.all(
        Array.from(channelMap.entries()).map(async ([channelId, entry]) => {
          const links = await perspective.get(
            new LinkQuery({ source: channelId, predicate: 'ad4m://has_child' }),
          );
          // Find the most recent link timestamp
          let latest = '';
          for (const link of links) {
            if (link.timestamp > latest) latest = link.timestamp;
          }
          entry.lastActivity = latest || undefined;
        }),
      );

      // Sort by lastActivity descending, take top N
      const sorted = Array.from(channelMap.values())
        .sort((a, b) => (b.lastActivity || '').localeCompare(a.lastActivity || ''))
        .slice(0, limit);
      return sorted;
    } catch (error) {
      console.error('Error in Channel.recentConversations():', error);
      return [];
    }
  }

  /**
   * Get pinned conversation channels.
   *
   * Converted from raw SPARQL → `Channel.findAll` post-#846.  The query
   * shape (`isPinned == true`, optional child conversation) is a textbook
   * Category B candidate from `docs/sparql-to-ad4m-model-migration.md`:
   * a `Where` on a scalar plus a HasMany include with `limit: 1`.
   *
   * Trade-off vs the raw SPARQL: the executor still has to fan out one
   * include sub-query for the `conversations` relation, but with
   * `withMetadata: false` the per-row reifier-metadata join is dropped
   * and the round-trip count remains 2 (main + include) — same as the
   * old `querySparql` + `OPTIONAL` block.
   */
  static async pinnedConversations(
    perspective: PerspectiveProxy,
  ): Promise<{ channelId: string; conversationId?: string }[]> {
    try {
      const pinned = await Channel.findAll(perspective, {
        where: { isPinned: true },
        include: { conversations: { limit: 1, withMetadata: false } },
        withMetadata: false,
        count: false,
      });
      return pinned.map((ch) => ({
        channelId: ch.id,
        conversationId: ch.conversations?.[0]?.id || undefined,
      }));
    } catch (error) {
      console.error('Error in Channel.pinnedConversations():', error);
      return [];
    }
  }

  conversationsData(): SynergyGroup[] {
    return this.conversations.map((c) => ({
      id: c.id,
      name: c.conversationName,
      summary: c.summary,
      timestamp: c.createdAt,
    }));
  }
}

export interface Channel extends HasManyMethods<
  | 'conversations'
  | 'childChannels'
  | 'messages'
  | 'views'
  | 'participants'
  | 'boards'
  | 'taskColumns'
  | 'tasks'
  | 'posts'
> {}
export default Channel;
