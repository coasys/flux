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
        SELECT
          out.uri AS id,
          author,
          timestamp,
          out->link[WHERE predicate = 'flux://entry_type'][0].out.uri AS type,
          fn::parse_literal(out->link[WHERE predicate = 'flux://body'][0].out.uri) AS messageBody,
          fn::parse_literal(out->link[WHERE predicate = 'flux://title'][0].out.uri) AS postTitle,
          fn::parse_literal(out->link[WHERE predicate = 'flux://name'][0].out.uri) AS taskName
        FROM link
        WHERE in.uri = '${this.id}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri
              IN ['flux://has_message', 'flux://has_post', 'flux://has_task']
        ORDER BY timestamp ASC
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      return (sparqlResult || []).map((item: any) => {
        let text = '';
        let type = '';

        if (item.type === 'flux://has_message') {
          text = item.messageBody || '';
          type = 'Message';
        } else if (item.type === 'flux://has_post') {
          text = item.postTitle || '';
          type = 'Post';
        } else if (item.type === 'flux://has_task') {
          text = item.taskName || '';
          type = 'Task';
        }

        return {
          id: item.id,
          author: item.author,
          timestamp: new Date(item.timestamp).toISOString(),
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
        PREFIX ad4m: <ad4m://ontology/>
        SELECT ?id ?author ?timestamp ?type ?body ?title ?taskName WHERE {
          ?link1 a ad4m:Link ; ad4m:source "${this.id}" ; ad4m:predicate "ad4m://has_child" ; ad4m:target ?id ; ad4m:author ?author ; ad4m:timestamp ?timestamp .
          ?typeLink a ad4m:Link ; ad4m:source ?id ; ad4m:predicate "flux://entry_type" ; ad4m:target ?type .
          FILTER(?type IN ("flux://has_message", "flux://has_post", "flux://has_task"))
          FILTER NOT EXISTS {
            ?sgLink a ad4m:Link ; ad4m:predicate "${SUBGROUP_ITEM}" ; ad4m:target ?id ; ad4m:source ?sg .
            ?sgTypeLink a ad4m:Link ; ad4m:source ?sg ; ad4m:predicate "flux://entry_type" ; ad4m:target "flux://conversation_subgroup" .
          }
          OPTIONAL { ?bodyLink a ad4m:Link ; ad4m:source ?id ; ad4m:predicate "flux://body" ; ad4m:target ?body . }
          OPTIONAL { ?titleLink a ad4m:Link ; ad4m:source ?id ; ad4m:predicate "flux://title" ; ad4m:target ?title . }
          OPTIONAL { ?taskNameLink a ad4m:Link ; ad4m:source ?id ; ad4m:predicate "flux://name" ; ad4m:target ?taskName . }
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
        PREFIX ad4m: <ad4m://ontology/>
        SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE {
          ?link1 a ad4m:Link ; ad4m:source "${this.id}" ; ad4m:predicate "ad4m://has_child" ; ad4m:target ?id .
          ?typeLink a ad4m:Link ; ad4m:source ?id ; ad4m:predicate "flux://entry_type" ; ad4m:target ?type .
          FILTER(?type IN ("flux://has_message", "flux://has_post", "flux://has_task"))
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
