import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty, LinkQuery, Literal } from "@coasys/ad4m";
import Topic, { TopicWithRelevance } from "../topic";
import SemanticRelationship from "../semantic-relationship";
import Conversation from "../conversation";
import { SynergyTopic, SynergyItem } from "@coasys/flux-utils";

@SDNAClass({
  name: "ConversationSubgroup",
})
export default class ConversationSubgroup extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://conversation_subgroup",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_name",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  subgroupName: string;

  @SubjectProperty({
    through: "flux://has_summary",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  summary: string;

  async stats(): Promise<{ totalItems: number; participants: string[] }> {
    // find the total item count and the dids of participants in the subgroup
    try {
      const result = await this.perspective.infer(`
        findall([ItemCount, SortedAuthors], (
          % 1. Gather all items in the subgroup
          findall(Item, (
            triple("${this.baseExpression}", "ad4m://has_child", Item),
            % Ensure item is not a SemanticRelationship
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
          ), AllItems),
  
          % 2. Deduplicate items
          sort(AllItems, UniqueItems),
          length(UniqueItems, ItemCount),
  
          % 3. For each item, gather its authors
          findall(Author, (
            member(I, UniqueItems),
            link(_, "ad4m://has_child", I, _, Author)
          ), AuthorList),
  
          % 4. Remove duplicates among authors
          sort(AuthorList, SortedAuthors)
        ), [Stats]).
      `);
      const [totalItems, participants] = result[0]?.Stats ?? [];
      return { totalItems: totalItems ?? 0, participants: participants ?? [] };
    } catch (error) {
      console.error("Error getting subgroup stats:", error);
      return { totalItems: 0, participants: [] };
    }
  }

  async topics(): Promise<SynergyTopic[]> {
    // find the subgroups topics
    try {
      const result = await this.perspective.infer(`
        % Collect and deduplicate topic data for this specific subgroup
        findall(TopicList, (
          findall([TopicBase, TopicName], (
            % 1. Find semantic relationships where 'flux://has_expression' = this subgroup's baseExpression
            subject_class("SemanticRelationship", SR),
            instance(SR, Relationship),
            triple(Relationship, "flux://has_expression", "${this.baseExpression}"),
            
            % 2. Retrieve the Topic base
            triple(Relationship, "flux://has_tag", TopicBase),
            
            % 3. Get the topic class & name
            subject_class("Topic", T),
            instance(T, TopicBase),
            property_getter(T, TopicBase, "topic", TopicName)
          ), UnsortedTopics),
    
          % 4. Deduplicate via sort
          sort(UnsortedTopics, TopicList)
        ), [Topics]).
      `);

      return (
        result[0]?.Topics?.map(
          ([baseExpression, name]): SynergyTopic => ({
            baseExpression,
            name: Literal.fromUrl(name).get().data,
          })
        ) || []
      );
    } catch (error) {
      console.error("Error getting subgroup topics:", error);
      return [];
    }
  }

  async itemsData(): Promise<SynergyItem[]> {
    // find the necissary data to render the subgroups items in timeline components
    try {
      const result = await this.perspective.infer(`
        findall([Item, Timestamp, Author, Type, Text], (
          % 1. Get item linked to subgroup
          triple("${this.baseExpression}", "ad4m://has_child", Item),
    
          % 2. Get timestamp and author from earliest link
          findall([T, A], link(_, "ad4m://has_child", Item, T, A), AllData),
          sort(AllData, SortedData),
          SortedData = [[Timestamp, Author]|_],
    
          % 3. Check item type and get text content
          (
            Type = "Message",
            subject_class("Message", MC),
            instance(MC, Item), 
            property_getter(MC, Item, "body", Text)
            ;
            Type = "Post",
            subject_class("Post", PC),
            instance(PC, Item), 
            property_getter(PC, Item, "title", Text)
            ;
            Type = "Task",
            subject_class("Task", TC),
            instance(TC, Item), 
            property_getter(TC, Item, "name", Text)
          )
        ), Items).
      `);
      const icons = { Message: "chat", Post: "postcard", Task: "kanban" };
      return (result[0]?.Items || []).map(([baseExpression, timestamp, author, type, text]) => ({
        baseExpression,
        type,
        timestamp: new Date(timestamp).toISOString(),
        author,
        text: Literal.fromUrl(text).get().data,
        icon: icons[type] || "question",
      }));
    } catch (error) {
      console.error("Error getting subgroup items:", error);
      return [];
    }
  }

  async parentConversation(): Promise<Conversation> {
    const allConversations = (await Conversation.all(this.perspective)) as Conversation[];
    const parentLinks = await this.perspective.get(
      new LinkQuery({ predicate: "ad4m://has_child", target: this.baseExpression })
    );
    const parentConversation = allConversations.find((c) =>
      parentLinks.find((p) => p.data.source === c.baseExpression)
    );
    return parentConversation;
  }

  async semanticRelationships(): Promise<SemanticRelationship[]> {
    return (await SemanticRelationship.query(this.perspective, {
      where: { expression: this.baseExpression },
    })) as SemanticRelationship[];
  }

  // todo: investigate why deduplication is necessary (just to handle errors?)
  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    const result = await this.perspective.infer(`
      findall(TopicList, (
        % First get all topic triples
        findall([TopicBase, TopicName, Relevance], (
          % 1. Find semantic relationships where expression = this subgroup
          subject_class("SemanticRelationship", SR),
          instance(SR, Relationship),
          triple(Relationship, "flux://has_expression", "${this.baseExpression}"),
          
          % 2. Get topic and relevance
          triple(Relationship, "flux://has_tag", TopicBase),
          property_getter(SR, Relationship, "relevance", Relevance),
          
          % 3. Get topic name
          subject_class("Topic", T),
          instance(T, TopicBase),
          property_getter(T, TopicBase, "topic", TopicName)
        ), UnsortedTopics),
        
        % 4. Remove duplicates via sort
        sort(UnsortedTopics, TopicList)
      ), [Topics]).
    `);

    return (
      result[0]?.Topics?.map(([base, name, relevance]) => ({
        baseExpression: base,
        name: Literal.fromUrl(name).get().data,
        relevance: parseInt(Literal.fromUrl(relevance).get().data, 10),
      })) || []
    );
  }

  async updateTopicWithRelevance(topicName: string, relevance: number, isNewGroup?: boolean) {
    const topic = await Topic.byName(this.perspective, topicName);
    const existingTopicRelationship = isNewGroup
      ? null
      : await SemanticRelationship.query(this.perspective, {
          where: { expression: this.baseExpression, tag: topic.baseExpression },
        })[0];

    if (existingTopicRelationship) {
      existingTopicRelationship.relevance = relevance;
      await existingTopicRelationship.update();
    } else {
      const relationship = new SemanticRelationship(this.perspective);
      relationship.expression = this.baseExpression;
      relationship.tag = topic.baseExpression;
      relationship.relevance = relevance;
      await relationship.save();
    }
  }
}
