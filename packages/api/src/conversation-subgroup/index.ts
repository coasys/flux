import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
import Topic, { TopicWithRelevance } from "../topic";
import SemanticRelationship from "../semantic-relationship";

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

  async semanticRelationships(): Promise<SemanticRelationship[]> {
    const allSemanticRelationships = (await SemanticRelationship.all(this.perspective)) as any;
    const subgroupSemanticRelationships = allSemanticRelationships.filter(
      (rel) => rel.expression == this.baseExpression
    );
    return subgroupSemanticRelationships;
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
    const allSemanticRelationships = isNewGroup ? [] : await this.semanticRelationships();
    const existingTopicRelationship = allSemanticRelationships.find((sr) => sr.tag == topic.baseExpression);

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
