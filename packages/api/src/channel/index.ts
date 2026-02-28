import { Ad4mModel, HasMany, HasManyMethods, Flag, Model, Property } from '@coasys/ad4m';
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
  FLUX_APP,
  FLUX_PARTICIPANT,
  CHANNEL_MESSAGE,
  CHANNEL_CONVERSATION,
  CHANNEL_SUBCHANNEL,
  SUBGROUP_ITEM,
  CHANNEL_TASK_BOARD,
  CHANNEL_TASK_COLUMN,
  CHANNEL_TASK,
  CHANNEL_POST,
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

  @HasMany(() => App, { through: FLUX_APP })
  views: App[] = [];

  @HasMany({ through: FLUX_PARTICIPANT })
  participants: string[] = [];

  @HasMany(() => Message, { through: CHANNEL_MESSAGE })
  messages: Message[] = [];

  @HasMany(() => Conversation, { through: CHANNEL_CONVERSATION })
  conversations: Conversation[] = [];

  @HasMany(() => Channel, { through: CHANNEL_SUBCHANNEL })
  childChannels: Channel[] = [];

  @HasMany(() => TaskBoard, { through: CHANNEL_TASK_BOARD })
  boards: TaskBoard[] = [];

  @HasMany(() => TaskColumn, { through: CHANNEL_TASK_COLUMN })
  taskColumns: TaskColumn[] = [];

  @HasMany(() => Task, { through: CHANNEL_TASK })
  tasks: Task[] = [];

  @HasMany(() => Post, { through: CHANNEL_POST })
  posts: Post[] = [];

  async unprocessedItems(): Promise<SynergyItem[]> {
    // Get all unprocessed items in the channel
    try {
      // const prologQuery = `
      //   findall([ItemId, Author, Timestamp, Type, Text], (
      //     % 1. Get channel item
      //     triple("${this.id}", "ad4m://has_child", ItemId),
      //
      //     % 2. Ensure item is not yet connected to a subgroup (i.e unprocessed)
      //     findall(SubgroupItem, (
      //       subject_class("ConversationSubgroup", CS),
      //       instance(CS, Subgroup),
      //       triple(Subgroup, "ad4m://has_child", SubgroupItem)
      //     ), SubgroupItems),
      //     findall(X, (member(ItemId, SubgroupItems)), []),
      //
      //     % 3. Get timestamp and author
      //     findall(
      //       [Timestamp, Author],
      //       link(_, "ad4m://has_child", ItemId, Timestamp, Author),
      //       AllData
      //     ),
      //     sort(AllData, SortedData),
      //     SortedData = [[Timestamp, Author]|_],
      //
      //     % 4. Check item type and get text
      //     (
      //       Type = "Message",
      //       subject_class("Message", MessageClass),
      //       instance(MessageClass, ItemId),
      //       property_getter(MessageClass, ItemId, "body", Text)
      //       ;
      //       Type = "Post",
      //       subject_class("Post", PostClass),
      //       instance(PostClass, ItemId),
      //       property_getter(PostClass, ItemId, "title", Text)
      //       ;
      //       Type = "Task",
      //       subject_class("Task", TaskClass),
      //       instance(TaskClass, ItemId),
      //       property_getter(TaskClass, ItemId, "name", Text)
      //     )
      //   ), Items),
      //   % 5. Remove duplicates
      //   sort(Items, UniqueItems).
      // `;

      const surrealQuery = `
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
          AND predicate IN ['flux://has_message', 'flux://has_post', 'flux://has_task']
          AND out<-link[WHERE predicate = '${SUBGROUP_ITEM}' AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'][0] IS NONE
        ORDER BY timestamp ASC
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      return (surrealResult || []).map((item: any) => {
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
      console.error('Error getting channel items:', error);
      return [];
    }
  }

  async totalItemCount(): Promise<number> {
    // Find the total number of items in the channel
    try {
      // const prologQuery = `
      //   findall(Count, (
      //     findall(Item, (
      //       % 1. Get items linked to channel
      //       triple("${this.id}", "ad4m://has_child", Item),
      //
      //       % 2. Check item is of valid type
      //       (
      //         subject_class("Message", MC),
      //         instance(MC, Item)
      //         ;
      //         subject_class("Post", PC),
      //         instance(PC, Item)
      //         ;
      //         subject_class("Task", TC),
      //         instance(TC, Item)
      //       )
      //     ), Items),
      //
      //     % 3. Get length of valid items
      //     length(Items, Count)
      //   ), [TotalCount]).
      // `;

      const surrealQuery = `
        SELECT count() AS count
        FROM link
        WHERE in.uri = '${this.id}'
          AND predicate IN ['flux://has_message', 'flux://has_post', 'flux://has_task']
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);
      const countValue = surrealResult[0]?.count;
      return typeof countValue === 'object' && countValue?.Int !== undefined ? countValue.Int : (countValue ?? 0);
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
