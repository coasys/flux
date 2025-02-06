import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty, LinkQuery, Literal } from "@coasys/ad4m";
import Topic, { TopicWithRelevance } from "../topic";
import SemanticRelationship from "../semantic-relationship";
import Conversation from "../conversation";

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
