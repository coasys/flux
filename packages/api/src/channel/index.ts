import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { Property, Collection, ModelOptions, Flag, Ad4mModel, Literal } from "@coasys/ad4m";
import { SynergyItem, SynergyGroup, icons } from "@coasys/flux-utils";
import App from "../app";

const { FLUX_APP, NAME, ENTRY_TYPE } = community;

@ModelOptions({ name: "Channel" })
export class Channel extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @Property({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @Collection({
    through: "ad4m://has_child",
    where: {
      isInstance: App,
    },
  })
  views: string[] = [];

  async unprocessedItems(): Promise<SynergyItem[]> {
    // get all unprocessed items in the channel
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
          icon: icons[type] ? icons[type] : "question",
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error("Error getting channel items:", error);
      return [];
    }
  }

  async totalItemCount(): Promise<number> {
    // find the total number of items in the channel
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
      console.error("Error getting total item count:", error);
      return 0;
    }
  }

  async conversations(): Promise<SynergyGroup[]> {
    // find the necissary data to render conversations in timeline components
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
      console.error("Error getting channel conversations:", error);
      return [];
    }
  }
}

export default Channel;
