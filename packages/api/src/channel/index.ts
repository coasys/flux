import { Ad4mModel, HasMany, HasManyMethods, Flag, Literal, Model, Property } from '@coasys/ad4m';

// SPARQL migration helper
function parseLit(val: string | undefined): string {
  if (!val) return '';
  try { return Literal.fromUrl(val).get(); } catch { return val; }
}
import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { SynergyGroup, SynergyItem, icons } from '@coasys/flux-utils';
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
        SELECT ?id ?author ?timestamp ?type ?body ?title ?taskName WHERE {
          GRAPH ?link { <${this.id}> <ad4m://has_child> ?id . }
          ?link <ad4m://ontology/timestamp> ?timestamp .
          ?link <ad4m://ontology/author> ?author .
          GRAPH ?g2 { ?id <flux://entry_type> ?type . }
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          OPTIONAL { GRAPH ?g3 { ?id <flux://body> ?body . } }
          OPTIONAL { GRAPH ?g4 { ?id <flux://title> ?title . } }
          OPTIONAL { GRAPH ?g5 { ?id <flux://name> ?taskName . } }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      return (sparqlResult || []).map((binding: any) => {
        let text = '';
        let type = '';
        const itemType = binding.type?.value;

        if (itemType === 'flux://has_message') {
          text = parseLit(binding.body?.value);
          type = 'Message';
        } else if (itemType === 'flux://has_post') {
          text = parseLit(binding.title?.value);
          type = 'Post';
        } else if (itemType === 'flux://has_task') {
          text = parseLit(binding.taskName?.value);
          type = 'Task';
        }

        return {
          id: binding.id?.value,
          author: binding.author?.value,
          timestamp: new Date(binding.timestamp?.value).toISOString(),
          text,
          type,
          icon: icons[type] ? icons[type] : 'question',
        };
      });
    } catch (error) {
      console.error('Error getting all channel items:', error);
      return [];
    }
  }

  async unprocessedItems(): Promise<SynergyItem[]> {
    // Get all unprocessed items in the channel
    try {
      // SPARQL migration
      const sparqlQuery = `
        SELECT ?id ?author ?timestamp ?type ?body ?title ?taskName WHERE {
          GRAPH ?link1 { <${this.id}> <ad4m://has_child> ?id . }
          ?link1 <ad4m://ontology/author> ?author .
          ?link1 <ad4m://ontology/timestamp> ?timestamp .
          GRAPH ?g2 { ?id <flux://entry_type> ?type . }
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          FILTER NOT EXISTS {
            GRAPH ?sgLink { ?sg <${SUBGROUP_ITEM}> ?id . }
            GRAPH ?g3 { ?sg <flux://entry_type> <flux://conversation_subgroup> . }
          }
          OPTIONAL { GRAPH ?g4 { ?id <flux://body> ?body . } }
          OPTIONAL { GRAPH ?g5 { ?id <flux://title> ?title . } }
          OPTIONAL { GRAPH ?g6 { ?id <flux://name> ?taskName . } }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by id
      const itemMap = new Map<string, any>();
      for (const binding of sparqlResult || []) {
        const id = binding.id?.value;
        if (!id || itemMap.has(id)) continue;
        itemMap.set(id, binding);
      }

      return Array.from(itemMap.values()).map((binding: any) => {
        let text = '';
        let type = '';
        const itemType = binding.type?.value;

        if (itemType === 'flux://has_message') {
          text = parseLit(binding.body?.value);
          type = 'Message';
        } else if (itemType === 'flux://has_post') {
          text = parseLit(binding.title?.value);
          type = 'Post';
        } else if (itemType === 'flux://has_task') {
          text = parseLit(binding.taskName?.value);
          type = 'Task';
        }

        return {
          id: binding.id?.value,
          author: binding.author?.value,
          timestamp: new Date(binding.timestamp?.value).toISOString(),
          text,
          type,
          icon: icons[type] ? icons[type] : 'question',
        };
      });
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
          GRAPH ?g1 { <${this.id}> <ad4m://has_child> ?id . }
          GRAPH ?g2 { ?id <flux://entry_type> ?type . }
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);
      const countValue = sparqlResult?.[0]?.count?.value;
      return countValue ? parseInt(countValue, 10) : 0;
    } catch (error) {
      console.error('Error getting total item count:', error);
      return 0;
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
