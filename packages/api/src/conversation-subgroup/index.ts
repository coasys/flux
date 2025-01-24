import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
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
    const allRelationships = (await SemanticRelationship.query(this.perspective, {
      source: this.baseExpression,
    })) as any;
  
    const topics: TopicWithRelevance[] = [];
    for (const rel of allRelationships) {
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

  async semanticRelationships(): Promise<SemanticRelationship[]> {
    return await SemanticRelationship.query(this.perspective, {
      source: this.baseExpression,
    }) as SemanticRelationship[]
  }

  async setTopicWithRelevance(topicName: string, relevance: number, isNewGroup?: boolean) {
    let topic = await Topic.byName(this.perspective, topicName);
    let allSemanticRelationships = isNewGroup ? [] : await this.semanticRelationships()
    let existingTopicRelationship = allSemanticRelationships.find(sr => sr.tag == topic.baseExpression)

    if(existingTopicRelationship) {
      existingTopicRelationship.relevance = relevance;
      await existingTopicRelationship.save()
    } else {
      const relationship = new SemanticRelationship(this.perspective);
      relationship.expression = this.baseExpression;
      relationship.tag = topic.baseExpression;
      relationship.relevance = relevance;
      await relationship.save();
    }
  }
}
