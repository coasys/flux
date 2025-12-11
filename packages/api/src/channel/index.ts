import { Ad4mModel, Collection, Flag, Literal, ModelOptions, Optional, Property } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { SynergyGroup, SynergyItem, icons } from '@coasys/flux-utils';
import App from '../app';

const { ENTRY_TYPE, CHANNEL_NAME, CHANNEL_DESCRIPTION, CHANNEL_IS_CONVERSATION, CHANNEL_IS_PINNED } = community;

@ModelOptions({ name: 'Channel' })
export class Channel extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @Property({
    through: CHANNEL_NAME,
    writable: true,
    resolveLanguage: 'literal',
  })
  name: string;

  @Optional({
    through: CHANNEL_DESCRIPTION,
    writable: true,
    resolveLanguage: 'literal',
  })
  description: string;

  @Optional({
    through: CHANNEL_IS_CONVERSATION,
    writable: true,
    resolveLanguage: 'literal',
  })
  isConversation: boolean;

  @Optional({
    through: CHANNEL_IS_PINNED,
    writable: true,
    resolveLanguage: 'literal',
  })
  isPinned: boolean;

  @Collection({
    through: 'ad4m://has_child',
    where: { isInstance: App },
  })
  views: string[] = [];

  async unprocessedItems(): Promise<SynergyItem[]> {
    // Get all unprocessed items in the channel
    try {
      // const prologQuery = `
      //   findall([ItemId, Author, Timestamp, Type, Text], (
      //     % 1. Get channel item
      //     triple("${this.baseExpression}", "ad4m://has_child", ItemId),
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
          out.uri AS baseExpression,
          author,
          timestamp,
          out->link[WHERE predicate = 'flux://entry_type'][0].out.uri AS type,
          fn::parse_literal(out->link[WHERE predicate = 'flux://body'][0].out.uri) AS messageBody,
          fn::parse_literal(out->link[WHERE predicate = 'flux://title'][0].out.uri) AS postTitle,
          fn::parse_literal(out->link[WHERE predicate = 'flux://name'][0].out.uri) AS taskName
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
          AND out<-link[WHERE predicate = 'ad4m://has_child' AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'][0] IS NONE
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
          baseExpression: item.baseExpression,
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
      //       triple("${this.baseExpression}", "ad4m://has_child", Item),
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
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);
      const countValue = surrealResult[0]?.count;
      return typeof countValue === 'object' && countValue?.Int !== undefined ? countValue.Int : (countValue ?? 0);
    } catch (error) {
      console.error('Error getting total item count:', error);
      return 0;
    }
  }

  async allAuthors(): Promise<string[]> {
    // Find the did of everyone who has created an item in the channel
    try {
      // const prologQuery = `
      //   findall(Author, (
      //     % 1. Get channel item
      //     triple("${this.baseExpression}", "ad4m://has_child", ItemId),
      //
      //     % 2. Get author from link
      //     link(_, "ad4m://has_child", ItemId, _, Author),
      //
      //     % 3. Check item is of valid type
      //     (
      //       subject_class("Message", MessageClass),
      //       instance(MessageClass, ItemId)
      //       ;
      //       subject_class("Post", PostClass),
      //       instance(PostClass, ItemId)
      //       ;
      //       subject_class("Task", TaskClass),
      //       instance(TaskClass, ItemId)
      //     )
      //   ), AuthorsWithDuplicates),
      //   % 4. Remove duplicates
      //   sort(AuthorsWithDuplicates, UniqueAuthors).
      // `;

      const surrealQuery = `
        SELECT VALUE author
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND author IS NOT NONE
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
      `;

      const surrealResult: string[] = await this.perspective.querySurrealDB(surrealQuery);

      // Deduplicate authors
      return [...new Set(surrealResult || [])];
    } catch (error) {
      console.error('Error getting channel authors:', error);
      return [];
    }
  }

  async conversations(): Promise<SynergyGroup[]> {
    // Find the necissary data to render conversations in timeline components
    try {
      // const prologQuery = `
      //   findall(ConversationInfo, (
      //     % 1. Identify all conversations in the channel
      //     subject_class("Conversation", CC),
      //     instance(CC, Conversation),

      //     % 2. Get timestamp from link
      //     link("${this.baseExpression}", "ad4m://has_child", Conversation, Timestamp, _),

      //     % 3. Retrieve conversation properties
      //     property_getter(CC, Conversation, "conversationName", ConversationName),
      //     property_getter(CC, Conversation, "summary", Summary),

      //     % 4. Build a single structure for each conversation
      //     ConversationInfo = [Conversation, ConversationName, Summary, Timestamp]
      //   ), Conversations).
      // `;

      const surrealQuery = `
        SELECT
          out.uri AS baseExpression,
          timestamp,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_name'][0].out.uri) AS name,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_summary'][0].out.uri) AS summary
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://has_name'][0] IS NOT NONE
          AND out->link[WHERE predicate = 'flux://has_summary'][0] IS NOT NONE
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation'
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      return (surrealResult || []).map((conv: any) => ({
        baseExpression: conv.baseExpression,
        name: conv.name,
        summary: conv.summary,
        timestamp: new Date(conv.timestamp).toISOString(),
      }));
    } catch (error) {
      console.error('Error getting channel conversations:', error);
      return [];
    }
  }
}

export default Channel;
