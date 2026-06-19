import { Model, Ad4mModel, Flag, HasMany, LinkQuery, Property, Literal, parseLit } from '@coasys/ad4m';
import Topic, { TopicWithRelevance } from '../topic';
import SemanticRelationship from '../semantic-relationship';
import { SynergyTopic, SynergyItem, ItemType, icons } from '@coasys/flux-utils';
import { community } from '@coasys/flux-constants';

const { FLUX_PARTICIPANT, SUBGROUP_ITEM } = community;

// SPARQL binding shapes — typed via `querySparql<T>()`.
interface TopicBinding { topicBase: string; topicNameRaw?: string }
interface TopicRelevanceBinding extends TopicBinding { relevanceRaw?: string }
interface SubgroupItemBinding {
  id: string;
  type: string;
  author: string;
  timestamp: string;
  body?: string;
  title?: string;
  taskName?: string;
  transcriptStart?: string;
  channelTs?: string;
}
interface SubgroupItem {
  id: string;
  type: string;
  author: string;
  channelTimestamp: string;
  messageBody: string;
  postTitle: string;
  taskName: string;
}

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
    // Converted from two parallel SPARQLs to a single parallel block of
    // (a) one indexed `queryLinks` to enumerate subgroup→item links and
    // (b) one indexed `queryLinks` for participants.  Both bypass SPARQL
    // entirely — the historical SPARQL itemsQuery did a multi-type
    // `FILTER(?type IN (...))` which can't be pushed into a single
    // Ad4mModel query without three parallel `findAllAndCount` calls
    // and a sum.  Using indexed link lookup avoids that round-trip
    // multiplication while keeping the data shape identical to the
    // original query (the subgroup→item link target is always a
    // Message/Post/Task by Flux invariant).
    try {
      const [itemLinks, participantLinks] = await Promise.all([
        this.perspective.get(
          new LinkQuery({ source: this.id, predicate: SUBGROUP_ITEM }),
        ),
        this.perspective.get(
          new LinkQuery({ source: this.id, predicate: FLUX_PARTICIPANT }),
        ),
      ]);
      const totalItems = new Set(
        (itemLinks || [])
          .map((l: any) => l.data?.target)
          .filter(Boolean),
      ).size;
      const participants = (participantLinks || [])
        .map((l: any) => l.data?.target)
        .filter(Boolean);
      return { totalItems, participants };
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

      const sparqlResult = await this.perspective.querySparql<TopicBinding[]>(sparqlQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, { topicBase: string; topicName: string }>();
      for (const binding of sparqlResult || []) {
        const topicBase = binding.topicBase;
        if (topicBase && !uniqueTopics.has(topicBase)) {
          uniqueTopics.set(topicBase, {
            topicBase,
            topicName: parseLit(binding.topicNameRaw),
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
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?id ?type ?author ?timestamp ?body ?title ?taskName ?transcriptStart ?channelTs WHERE {
          <${this.id}> <${SUBGROUP_ITEM}> ?id .
          ?_sgReifier rdf:reifies <<( <${this.id}> <${SUBGROUP_ITEM}> ?id )>> .
          ?_sgReifier <ad4m://ontology/timestamp> ?timestamp .
          ?id <flux://entry_type> ?type .
          ?_typeReifier rdf:reifies <<( ?id <flux://entry_type> ?type )>> .
          ?_typeReifier <ad4m://ontology/author> ?author .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          OPTIONAL { ?id <flux://body> ?body . }
          OPTIONAL { ?id <flux://title> ?title . }
          OPTIONAL { ?id <flux://name> ?taskName . }
          OPTIONAL { ?id <flux://transcript_started_at> ?transcriptStart . }
          OPTIONAL { ?chSrc <ad4m://has_child> ?id .
                     ?_chReifier rdf:reifies <<( ?chSrc <ad4m://has_child> ?id )>> .
                     ?_chReifier <ad4m://ontology/timestamp> ?channelTs .
                     ?chSrc <flux://entry_type> <flux://has_channel> . }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql<SubgroupItemBinding[]>(sparqlQuery);

      // Collect items — keep duplicate IDs so the view can detect and clean them up
      const items: SubgroupItem[] = [];
      const seen = new Map<string, SubgroupItem>();
      for (const binding of sparqlResult || []) {
        const id = binding.id;
        if (!id) continue;

        // Coalesce OPTIONAL fields from multiple SPARQL rows for same id
        if (seen.has(id)) {
          // Merge optional fields from this binding into the existing item
          const existing = seen.get(id)!;
          const transcriptStart = parseLit(binding.transcriptStart);
          const channelTs = binding.channelTs;
          const fallbackTs = binding.timestamp;
          if (!existing.channelTimestamp) {
            existing.channelTimestamp = transcriptStart || channelTs || fallbackTs;
          }
          if (!existing.messageBody) existing.messageBody = parseLit(binding.body);
          if (!existing.postTitle) existing.postTitle = parseLit(binding.title);
          if (!existing.taskName) existing.taskName = parseLit(binding.taskName);
          if (!existing.type) existing.type = binding.type;
          if (!existing.author) existing.author = binding.author;
          continue;
        }

        const transcriptStart = parseLit(binding.transcriptStart);
        const channelTs = binding.channelTs;
        const fallbackTs = binding.timestamp;
        const channelTimestamp = transcriptStart || channelTs || fallbackTs;

        const item: SubgroupItem = {
          id,
          type: binding.type,
          author: binding.author,
          channelTimestamp,
          messageBody: parseLit(binding.body),
          postTitle: parseLit(binding.title),
          taskName: parseLit(binding.taskName),
        };
        seen.set(id, item);
        items.push(item);
      }

      // Sort by the effective timestamp (transcriptStart || channelTs || fallback)
      const sorted = items.sort((a, b) => {
        const tsA = a.channelTimestamp || '';
        const tsB = b.channelTimestamp || '';
        return tsA < tsB ? -1 : tsA > tsB ? 1 : 0;
      });
      return sorted.map((item) => {
        let text = '';
        let type: ItemType = 'Message';

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

      const sparqlResult = await this.perspective.querySparql<TopicRelevanceBinding[]>(sparqlQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, { topicBase: string; topicName: string; relevance: string }>();
      for (const binding of sparqlResult || []) {
        const topicBase = binding.topicBase;
        if (topicBase && !uniqueTopics.has(topicBase)) {
          uniqueTopics.set(topicBase, {
            topicBase,
            topicName: parseLit(binding.topicNameRaw),
            relevance: parseLit(binding.relevanceRaw),
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
