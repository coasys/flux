import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
import { findTopics } from "@coasys/flux-utils/src/synergy";
import Topic, { TopicWithRelevance } from "../topic";
import SemanticRelationship from "../semantic-relationship"

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

  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    return findTopics(this.perspective, this.baseExpression)
  }

  async addTopicWithRelevance(topicName: string, relevance: number) {
    let topic = await Topic.byName(this.perspective, topicName);
    const relationship = new SemanticRelationship(this.perspective);
    relationship.expression = this.baseExpression;
    relationship.tag = topic.baseExpression;
    relationship.relevance = relevance;
    await relationship.save();
  }
}
