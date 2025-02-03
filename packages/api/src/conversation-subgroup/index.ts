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

  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    // query prolog to find the totalSubgroups count and participant dids for the conversation
    const result = await this.perspective.infer(`
        findall([TopicInstance, TopicName, Relevance], (
          % SemanticRelationships of this group
          subject_class("SemanticRelationship", SR),
          instance(SR, SRInstance),
          property_getter(SR, SRInstance, "expression", "${this.baseExpression}"),
          property_getter(SR, SRInstance, "relevance", Relevance),
          property_getter(SR, SRInstance, "tag", TopicInstance),

          subject_class("Topic", T),
          instance(T, TopicInstance),
          property_getter(T, TopicInstance, "topic", TopicName),
        ), TopicRelevanceList).
    `);

    console.log("topicsWithRelevance prolog result:", result);

    let topicRelevanceList = result[0]?.TopicRelevanceList;
    if (!topicRelevanceList) {
      return [];
    }

    const topics: TopicWithRelevance[] = [];
    for (const [topicInstance, topicName, relevance] of topicRelevanceList) {
      try {
        topics.push({
          baseExpression: topicInstance,
          name: Literal.fromUrl(topicName).get().data,
          relevance: Literal.fromUrl(relevance).get().data,
        });
      } catch (error) {
        continue;
      }
    }

    console.log("topicsWithRelevance objects:", topics);
    return topics
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
