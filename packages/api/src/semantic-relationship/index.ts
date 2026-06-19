import { Model, Ad4mModel, Flag, HasOne, Property } from '@coasys/ad4m';
import { parseLit } from '../utils/parseLit';
import { SynergyMatch } from '@coasys/flux-utils';
import Embedding from '../embedding';
import Topic from '../topic';

const TYPE_MAP: Record<string, string> = {
  Message: 'flux://has_message',
  Post: 'flux://has_post',
  Task: 'flux://has_task',
};

@Model({ name: 'SemanticRelationship' })
export default class SemanticRelationship extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://has_semantic_relationship' })
  type: string;

  @Property({ through: 'flux://has_expression' })
  expression: string; // base url of expression

  // The raw `tag` IRI — kept for back-compat with callers that just want
  // the URL. New call sites should prefer `embeddingTag` / `topicTag` which
  // resolve to fully hydrated instances filtered by `entry_type`.
  @Property({ through: 'flux://has_tag' })
  tag: string;

  // Two `@HasOne` relations on the same `flux://has_tag` predicate. The
  // conformance filter on each target class's `@Flag` discriminates which
  // related instance hydrates: only Embedding instances bind to
  // `embeddingTag`, only Topic instances bind to `topicTag`. Lets
  // `include: { embeddingTag: true }` flow through Ad4mModel's batched
  // hydration instead of an N+1 `getExpression` round-trip per SR.
  @HasOne(() => Embedding, { through: 'flux://has_tag' })
  embeddingTag?: Embedding;

  @HasOne(() => Topic, { through: 'flux://has_tag' })
  topicTag?: Topic;

  @Property({ through: 'flux://has_relevance' })
  relevance: number; // 0 - 100

  /**
   * Fetch the embedding vector attached to a given expression.
   *
   * Converted to `findAll` + `include: { embeddingTag }` post-#846.  The
   * polymorphic-on-same-predicate `@HasOne` for `embeddingTag` (alongside
   * `topicTag` on the same `flux://has_tag` predicate) resolves to an
   * Embedding instance only when the conformance filter matches the
   * Embedding `@Flag` — verified working in wind tunnel S16
   * (`include actually fires: yes` once SHACL is emitted correctly).
   *
   * `withMetadata: false` + `count: false` collapse the model_query
   * overhead to ~2-3× of the raw SPARQL cost (vs ~5× without them at
   * medium scale).  The follow-up `getExpression` to the embedding-vector
   * language controller is unchanged — that data lives outside the
   * perspective and can't be inlined into a SPARQL.
   */
  async itemEmbedding(itemId: string): Promise<number[]> {
    try {
      const srs = await SemanticRelationship.findAll(this.perspective, {
        where: { expression: itemId },
        include: { embeddingTag: { withMetadata: false } },
        limit: 1,
        withMetadata: false,
        count: false,
      });
      const embeddingUrl = (srs[0] as any)?.embeddingTag?.embedding;
      if (!embeddingUrl) return [];
      const embeddingExpression = await this.perspective.getExpression(embeddingUrl);
      return JSON.parse(embeddingExpression.data);
    } catch (error) {
      console.error('Error getting items embedding', error);
      return [];
    }
  }

  async allConversationEmbeddings(): Promise<SynergyMatch[]> {
    try {
      const sparqlQuery = `
        SELECT ?itemId ?embedding ?channelId ?channelName WHERE {
          ?itemId <flux://entry_type> <flux://conversation> .
          ?channelId <ad4m://has_child> ?itemId .
          ?channelId <flux://entry_type> <flux://has_channel> .
          ?channelId <flux://has_channel_name> ?channelName .
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_expression> ?itemId .
          ?sr <flux://has_tag> ?embeddingId .
          ?embeddingId <flux://entry_type> <flux://has_embedding> .
          ?embeddingId <flux://embedding> ?embedding .
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      return Promise.all(
        (sparqlResult || []).map(async (binding: any) => {
          const embeddingExpression = await this.perspective.getExpression(binding.embedding);
          return {
            baseExpression: binding.itemId,
            type: 'Conversation',
            embedding: JSON.parse(embeddingExpression.data),
            channelId: binding.channelId,
            channelName: parseLit(binding.channelName),
          };
        }),
      );
    } catch (error) {
      console.error('Error getting all conversation embedding', error);
      return [];
    }
  }

  async allSubgroupEmbeddings(): Promise<SynergyMatch[]> {
    try {
      const sparqlQuery = `
        SELECT ?itemId ?embedding ?channelId ?channelName WHERE {
          ?itemId <flux://entry_type> <flux://conversation_subgroup> .
          ?conv <ad4m://has_child> ?itemId .
          ?conv <flux://entry_type> <flux://conversation> .
          ?channelId <ad4m://has_child> ?conv .
          ?channelId <flux://entry_type> <flux://has_channel> .
          ?channelId <flux://has_channel_name> ?channelName .
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_expression> ?itemId .
          ?sr <flux://has_tag> ?embeddingId .
          ?embeddingId <flux://entry_type> <flux://has_embedding> .
          ?embeddingId <flux://embedding> ?embedding .
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      return Promise.all(
        (sparqlResult || []).map(async (binding: any) => {
          const embeddingExpression = await this.perspective.getExpression(binding.embedding);
          return {
            baseExpression: binding.itemId,
            type: 'Subgroup',
            embedding: JSON.parse(embeddingExpression.data),
            channelId: binding.channelId,
            channelName: parseLit(binding.channelName),
          };
        }),
      );
    } catch (error) {
      console.error('Error getting all subgroup embedding', error);
      return [];
    }
  }

  async allItemEmbeddings(): Promise<SynergyMatch[]> {
    try {
      const sparqlQuery = `
        SELECT ?itemId ?type ?embedding ?channelId ?channelName WHERE {
          ?itemId <flux://entry_type> ?type .
          FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
          ?channelId <ad4m://has_child> ?itemId .
          ?channelId <flux://entry_type> <flux://has_channel> .
          ?channelId <flux://has_channel_name> ?channelName .
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_expression> ?itemId .
          ?sr <flux://has_tag> ?embeddingId .
          ?embeddingId <flux://entry_type> <flux://has_embedding> .
          ?embeddingId <flux://embedding> ?embedding .
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      const typeNameMap: Record<string, string> = {
        'flux://has_message': 'Message',
        'flux://has_post': 'Post',
        'flux://has_task': 'Task',
      };

      return Promise.all(
        (sparqlResult || []).map(async (binding: any) => {
          const embeddingExpression = await this.perspective.getExpression(binding.embedding);
          return {
            baseExpression: binding.itemId,
            type: typeNameMap[binding.type] || binding.type,
            embedding: JSON.parse(embeddingExpression.data),
            channelId: binding.channelId,
            channelName: parseLit(binding.channelName),
          };
        }),
      );
    } catch (error) {
      console.error('Error getting all item embedding', error);
      return [];
    }
  }

  async allItemEmbeddingsByType(itemType: string): Promise<SynergyMatch[]> {
    // itemType is plural like "Messages", "Posts", "Tasks"
    const singular = itemType.slice(0, -1); // "Message", "Post", "Task"
    const typeUri = TYPE_MAP[singular];
    if (!typeUri) {
      console.error(`Unknown item type: ${itemType}`);
      return [];
    }

    try {
      const sparqlQuery = `
        SELECT ?itemId ?embedding ?channelId ?channelName WHERE {
          ?itemId <flux://entry_type> <${typeUri}> .
          ?channelId <ad4m://has_child> ?itemId .
          ?channelId <flux://entry_type> <flux://has_channel> .
          ?channelId <flux://has_channel_name> ?channelName .
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_expression> ?itemId .
          ?sr <flux://has_tag> ?embeddingId .
          ?embeddingId <flux://entry_type> <flux://has_embedding> .
          ?embeddingId <flux://embedding> ?embedding .
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      return Promise.all(
        (sparqlResult || []).map(async (binding: any) => {
          const embeddingExpression = await this.perspective.getExpression(binding.embedding);
          return {
            baseExpression: binding.itemId,
            type: itemType,
            embedding: JSON.parse(embeddingExpression.data),
            channelId: binding.channelId,
            channelName: parseLit(binding.channelName),
          };
        }),
      );
    } catch (error) {
      console.error('Error getting item embeddings by type', error);
      return [];
    }
  }
}
