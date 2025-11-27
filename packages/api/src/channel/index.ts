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
      const result = await this.perspective.infer(`
        findall([ItemId, Author, Timestamp, Type, Text], (
          % 1. Get channel item
          triple("${this.baseExpression}", "ad4m://has_child", ItemId),
        
          % 2. Ensure item is not yet connected to a subgroup (i.e unprocessed)
          findall(SubgroupItem, (
            subject_class("ConversationSubgroup", CS),
            instance(CS, Subgroup),
            triple(Subgroup, "ad4m://has_child", SubgroupItem)
          ), SubgroupItems),
          findall(X, (member(ItemId, SubgroupItems)), []),
        
          % 3. Get timestamp and author
          findall(
            [Timestamp, Author], 
            link(_, "ad4m://has_child", ItemId, Timestamp, Author),
            AllData
          ),
          sort(AllData, SortedData),
          SortedData = [[Timestamp, Author]|_],
        
          % 4. Check item type and get text
          (
            Type = "Message",
            subject_class("Message", MessageClass),
            instance(MessageClass, ItemId), 
            property_getter(MessageClass, ItemId, "body", Text)
            ;
            Type = "Post",
            subject_class("Post", PostClass),
            instance(PostClass, ItemId), 
            property_getter(PostClass, ItemId, "title", Text)
            ;
            Type = "Task",
            subject_class("Task", TaskClass),
            instance(TaskClass, ItemId), 
            property_getter(TaskClass, ItemId, "name", Text)
          )
        ), Items),
        % 5. Remove duplicates
        sort(Items, UniqueItems).
      `);
      return (result[0]?.UniqueItems || [])
        .map(([itemId, author, timestamp, type, text]) => ({
          baseExpression: itemId,
          author,
          timestamp: new Date(timestamp).toISOString(),
          text: Literal.fromUrl(text).get().data,
          icon: icons[type] ? icons[type] : 'question',
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error getting channel items:', error);
      return [];
    }
  }

  async totalItemCount(): Promise<number> {
    // Find the total number of items in the channel
    try {
      const result = await this.perspective.infer(`
        findall(Count, (
          findall(Item, (
            % 1. Get items linked to channel
            triple("${this.baseExpression}", "ad4m://has_child", Item),
            
            % 2. Check item is of valid type
            (
              subject_class("Message", MC),
              instance(MC, Item)
              ;
              subject_class("Post", PC),
              instance(PC, Item)
              ;
              subject_class("Task", TC),
              instance(TC, Item)
            )
          ), Items),
          
          % 3. Get length of valid items
          length(Items, Count)
        ), [TotalCount]).
      `);
      return result[0]?.TotalCount || 0;
    } catch (error) {
      console.error('Error getting total item count:', error);
      return 0;
    }
  }

  async allAuthors(): Promise<string[]> {
    // Find the did of everyone who has created an item in the channel
    try {
      const result = await this.perspective.infer(`
        findall(Author, (
          % 1. Get channel item
          triple("${this.baseExpression}", "ad4m://has_child", ItemId),
        
          % 2. Get author from link
          link(_, "ad4m://has_child", ItemId, _, Author),
        
          % 3. Check item is of valid type
          (
            subject_class("Message", MessageClass),
            instance(MessageClass, ItemId)
            ;
            subject_class("Post", PostClass),
            instance(PostClass, ItemId)
            ;
            subject_class("Task", TaskClass),
            instance(TaskClass, ItemId)
          )
        ), AuthorsWithDuplicates),
        % 4. Remove duplicates
        sort(AuthorsWithDuplicates, UniqueAuthors).
      `);
      return result[0]?.UniqueAuthors || [];
    } catch (error) {
      console.error('Error getting channel authors:', error);
      return [];
    }
  }

  async conversations(): Promise<SynergyGroup[]> {
    // Find the necissary data to render conversations in timeline components
    try {
      const result = await this.perspective.infer(`
      findall(ConversationInfo, (
        % 1. Identify all conversations in the channel
        subject_class("Conversation", CC),
        instance(CC, Conversation),
        
        % 2. Get timestamp from link
        link("${this.baseExpression}", "ad4m://has_child", Conversation, Timestamp, _),
  
        % 3. Retrieve conversation properties
        property_getter(CC, Conversation, "conversationName", ConversationName),
        property_getter(CC, Conversation, "summary", Summary),
  
        % 4. Build a single structure for each conversation
        ConversationInfo = [Conversation, ConversationName, Summary, Timestamp]
      ), Conversations).
    `);

      return (result[0]?.Conversations || []).map(([baseExpression, conversationName, summary, timestamp]) => ({
        baseExpression,
        name: Literal.fromUrl(conversationName).get().data,
        summary: Literal.fromUrl(summary).get().data,
        timestamp: new Date(timestamp).toISOString(),
      }));
    } catch (error) {
      console.error('Error getting channel conversations:', error);
      return [];
    }
  }
}

export default Channel;
