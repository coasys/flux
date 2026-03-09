import { Model, Ad4mModel, Flag, HasMany, Property, escapeSurrealString } from '@coasys/ad4m';
import Topic, { TopicWithRelevance } from '../topic';
import SemanticRelationship from '../semantic-relationship';
import { SynergyTopic, SynergyItem, icons } from '@coasys/flux-utils';
import { community } from '@coasys/flux-constants';

const { FLUX_PARTICIPANT, SUBGROUP_ITEM } = community;

@Model({ name: 'ConversationSubgroup' })
export default class ConversationSubgroup extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://conversation_subgroup' })
  type: string;

  @Property({ through: 'flux://has_name' })
  subgroupName: string;

  @Property({ through: 'flux://has_summary' })
  summary: string;

  @HasMany({ through: FLUX_PARTICIPANT })
  participants: string[] = [];

  async stats(): Promise<{ totalItems: number; participants: string[] }> {
    // find the total item count and the dids of participants in the subgroup
    try {
      // Count items by getting all matching URIs and counting them
      const itemsQuery = `
        SELECT VALUE out.uri
        FROM link
        WHERE in.uri = '${escapeSurrealString(this.id)}'
          AND predicate = '${escapeSurrealString(SUBGROUP_ITEM)}'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
      `;

      const itemsResult = await this.perspective.querySurrealDB(itemsQuery);
      const totalItems = itemsResult?.length || 0;

      // Use maintained participants Collection
      await this.get();
      return { totalItems, participants: this.participants };
    } catch (error) {
      console.error('Error getting subgroup stats:', error);
      return { totalItems: 0, participants: [] };
    }
  }

  async topics(): Promise<SynergyTopic[]> {
    // find the subgroups topics
    try {
      const surrealQuery = `
        SELECT
          out.uri AS topicBase,
          fn::parse_literal(out->link[WHERE predicate = 'flux://topic'][0].out.uri) AS topicName
        FROM link
        WHERE predicate = 'flux://has_tag'
          AND in->link[WHERE predicate = 'flux://has_expression'][0].out.uri = '${escapeSurrealString(this.id)}'
          AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_semantic_relationship'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_topic'
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const topic of surrealResult || []) {
        if (!uniqueTopics.has(topic.topicBase)) {
          uniqueTopics.set(topic.topicBase, topic);
        }
      }

      return Array.from(uniqueTopics.values()).map(
        ({ topicBase, topicName }): SynergyTopic => ({
          id: topicBase,
          name: topicName,
        }),
      );
    } catch (error) {
      console.error('Error getting subgroup topics:', error);
      return [];
    }
  }

  async itemsData(): Promise<SynergyItem[]> {
    // find the necissary data to render the subgroups items in timeline components
    try {
      const surrealQuery = `
        SELECT
          out.uri AS id,
          (
            fn::parse_literal(out->link[WHERE predicate = 'flux://transcript_started_at'][0].out.uri)
            ?? out<-link[WHERE predicate = 'flux://has_message' AND in->link[WHERE predicate = 'flux://entry_type' AND out.uri = 'flux://has_channel'][0] IS NOT NONE][0].timestamp
            ?? out<-link[WHERE predicate IN ['flux://has_post', 'flux://has_task'] AND in->link[WHERE predicate = 'flux://entry_type' AND out.uri = 'flux://has_channel'][0] IS NOT NONE][0].timestamp
            ?? out->link[WHERE predicate = 'flux://entry_type'][0].timestamp
            ?? timestamp
          ) AS channelTimestamp,
          out->link[WHERE predicate = 'flux://entry_type'][0].author AS author,
          out->link[WHERE predicate = 'flux://entry_type'][0].out.uri AS type,
          fn::parse_literal(out->link[WHERE predicate = 'flux://body'][0].out.uri) AS messageBody,
          fn::parse_literal(out->link[WHERE predicate = 'flux://title'][0].out.uri) AS postTitle,
          fn::parse_literal(out->link[WHERE predicate = 'flux://name'][0].out.uri) AS taskName
        FROM link
        WHERE in.uri = '${escapeSurrealString(this.id)}'
          AND predicate = '${escapeSurrealString(SUBGROUP_ITEM)}'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
        ORDER BY channelTimestamp ASC
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
          id: item.id,
          type,
          timestamp: item.channelTimestamp ? new Date(item.channelTimestamp).toISOString() : new Date(0).toISOString(),
          author: item.author,
          text,
          icon: icons[type] || 'question',
        };
      });
    } catch (error) {
      console.error('Error getting subgroup items:', error);
      return [];
    }
  }

  // todo: investigate why deduplication is necessary (just to handle errors?)
  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    try {
      const surrealQuery = `
        SELECT
          out.uri AS topicBase,
          fn::parse_literal(out->link[WHERE predicate = 'flux://topic'][0].out.uri) AS topicName,
          fn::parse_literal(in->link[WHERE predicate = 'flux://has_relevance'][0].out.uri) AS relevance
        FROM link
        WHERE predicate = 'flux://has_tag'
          AND in->link[WHERE predicate = 'flux://has_expression'][0].out.uri = '${escapeSurrealString(this.id)}'
          AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_semantic_relationship'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_topic'
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const topic of surrealResult || []) {
        if (!uniqueTopics.has(topic.topicBase)) {
          uniqueTopics.set(topic.topicBase, topic);
        }
      }

      return Array.from(uniqueTopics.values()).map(({ topicBase, topicName, relevance }) => ({
        id: topicBase,
        name: topicName,
        relevance: parseInt(relevance, 10) || 0,
      }));
    } catch (error) {
      console.error('Error getting subgroup topics with relevance:', error);
      return [];
    }
  }

  async updateTopicWithRelevance(
    topicName: string,
    relevance: number,
    isNewGroup: boolean,
    existingTopic: Topic | null,
    batchId: string,
  ) {
    let topic = existingTopic;
    if (!topic) {
      topic = await Topic.create(this.perspective, { topic: topicName }, { batchId });
    }
    const existingTopicRelationship = isNewGroup
      ? null
      : ((
          await SemanticRelationship.findAll(this.perspective, {
            where: { expression: this.id, tag: topic.id },
          })
        )[0] as SemanticRelationship);
    if (existingTopicRelationship) {
      existingTopicRelationship.relevance = relevance;
      await existingTopicRelationship.save(batchId);
    } else {
      await SemanticRelationship.create(
        this.perspective,
        { expression: this.id, tag: topic.id, relevance },
        { batchId },
      );
    }
  }
}
