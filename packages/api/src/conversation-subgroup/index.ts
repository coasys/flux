import { Model, Ad4mModel, Flag, HasMany, Property, Literal } from '@coasys/ad4m';

// SPARQL migration helper
function parseLit(val: string | undefined): string {
  if (!val) return '';
  try { return Literal.fromUrl(val).get(); } catch { return val; }
}
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
      // SPARQL migration
      const itemsQuery = `
        SELECT DISTINCT ?item WHERE {
          <${this.id}> <${SUBGROUP_ITEM}> ?item .
          ?item <flux://entry_type> ?type .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
        }
      `;

      const itemsResult = await this.perspective.querySparql(itemsQuery);
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
      // SPARQL migration
      const sparqlQuery = `
        SELECT ?topicBase ?topicNameRaw WHERE {
          ?semRel <flux://has_tag> ?topicBase .
          ?semRel <flux://has_expression> <${this.id}> .
          ?semRel <flux://entry_type> <flux://has_semantic_relationship> .
          ?topicBase <flux://entry_type> <flux://has_topic> .
          OPTIONAL { ?topicBase <flux://topic> ?topicNameRaw . }
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const binding of sparqlResult || []) {
        const topicBase = binding.topicBase?.value;
        if (topicBase && !uniqueTopics.has(topicBase)) {
          uniqueTopics.set(topicBase, {
            topicBase,
            topicName: parseLit(binding.topicNameRaw?.value),
          });
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
      // SPARQL migration
      const sparqlQuery = `
        SELECT ?id ?type ?author ?timestamp ?body ?title ?taskName ?transcriptStart ?channelTs WHERE {
          GRAPH ?link1 { <${this.id}> <${SUBGROUP_ITEM}> ?id . }
          ?link1 <ad4m://ontology/timestamp> ?timestamp .
          GRAPH ?typeLink { ?id <flux://entry_type> ?type . }
          ?typeLink <ad4m://ontology/author> ?author .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          OPTIONAL { ?id <flux://body> ?body . }
          OPTIONAL { ?id <flux://title> ?title . }
          OPTIONAL { ?id <flux://name> ?taskName . }
          OPTIONAL { ?id <flux://transcript_started_at> ?transcriptStart . }
          OPTIONAL { GRAPH ?chLink { ?chSrc <ad4m://has_child> ?id . }
                     ?chLink <ad4m://ontology/timestamp> ?channelTs .
                     ?chSrc <flux://entry_type> <flux://has_channel> . }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Collect items — keep duplicate IDs so the view can detect and clean them up
      const items: any[] = [];
      const seen = new Map<string, any>();
      for (const binding of sparqlResult || []) {
        const id = binding.id?.value;
        if (!id) continue;

        // Coalesce OPTIONAL fields from multiple SPARQL rows for same id
        if (seen.has(id)) {
          // Merge optional fields from this binding into the existing item
          const existing = seen.get(id);
          const transcriptStart = parseLit(binding.transcriptStart?.value);
          const channelTs = binding.channelTs?.value;
          const fallbackTs = binding.timestamp?.value;
          if (!existing.channelTimestamp) {
            existing.channelTimestamp = transcriptStart || channelTs || fallbackTs;
          }
          if (!existing.messageBody) existing.messageBody = parseLit(binding.body?.value);
          if (!existing.postTitle) existing.postTitle = parseLit(binding.title?.value);
          if (!existing.taskName) existing.taskName = parseLit(binding.taskName?.value);
          if (!existing.type) existing.type = binding.type?.value;
          if (!existing.author) existing.author = binding.author?.value;
          continue;
        }

        const transcriptStart = parseLit(binding.transcriptStart?.value);
        const channelTs = binding.channelTs?.value;
        const fallbackTs = binding.timestamp?.value;
        const channelTimestamp = transcriptStart || channelTs || fallbackTs;

        const item = {
          id,
          type: binding.type?.value,
          author: binding.author?.value,
          channelTimestamp,
          messageBody: parseLit(binding.body?.value),
          postTitle: parseLit(binding.title?.value),
          taskName: parseLit(binding.taskName?.value),
        };
        seen.set(id, item);
        items.push(item);
      }

      // Sort by the effective timestamp (transcriptStart || channelTs || fallback)
      const sorted = items.sort((a: any, b: any) => {
        const tsA = a.channelTimestamp || '';
        const tsB = b.channelTimestamp || '';
        return tsA < tsB ? -1 : tsA > tsB ? 1 : 0;
      });
      return sorted.map((item: any) => {
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

  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    try {
      // SPARQL migration
      const sparqlQuery = `
        SELECT ?topicBase ?topicNameRaw ?relevanceRaw WHERE {
          ?semRel <flux://has_tag> ?topicBase .
          ?semRel <flux://has_expression> <${this.id}> .
          ?semRel <flux://entry_type> <flux://has_semantic_relationship> .
          ?topicBase <flux://entry_type> <flux://has_topic> .
          OPTIONAL { ?topicBase <flux://topic> ?topicNameRaw . }
          OPTIONAL { ?semRel <flux://has_relevance> ?relevanceRaw . }
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const binding of sparqlResult || []) {
        const topicBase = binding.topicBase?.value;
        if (topicBase && !uniqueTopics.has(topicBase)) {
          uniqueTopics.set(topicBase, {
            topicBase,
            topicName: parseLit(binding.topicNameRaw?.value),
            relevance: parseLit(binding.relevanceRaw?.value),
          });
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
