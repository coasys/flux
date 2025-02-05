import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty, LinkQuery } from "@coasys/ad4m";
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
    const subgroupSemanticRelationships = await this.semanticRelationships();

    const topics: TopicWithRelevance[] = [];
    for (const rel of subgroupSemanticRelationships) {
      if (!rel.relevance) continue;

      try {
        const topicEntity = new Topic(this.perspective, rel.tag);
        const topic = await topicEntity.get();
        topics.push({
          baseExpression: rel.tag,
          name: topic.topic,
          relevance: rel.relevance,
        });
      } catch (error) {
        continue;
      }
    }

    return topics;
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
