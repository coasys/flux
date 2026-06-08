import { Model, Ad4mModel, Flag, Property } from '@coasys/ad4m';
import { parseLit } from '../utils/parseLit';
import type { AbortOptions } from '../shared/abort';
import { SynergyMatch } from '@coasys/flux-utils';

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

  @Property({ through: 'flux://has_tag' })
  tag: string; // base url of semantic tag

  @Property({ through: 'flux://has_relevance' })
  relevance: number; // 0 - 100

  async itemEmbedding(itemId: string, options?: AbortOptions): Promise<number[]> {
    try {
      const sparqlQuery = `
        SELECT ?embedding WHERE {
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_expression> <${itemId}> .
          ?sr <flux://has_tag> ?embeddingId .
          ?embeddingId <flux://entry_type> <flux://has_embedding> .
          ?embeddingId <flux://embedding> ?embedding .
        }
        LIMIT 1
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery, options);
      if (!sparqlResult?.[0]?.embedding) return [];

      const embeddingExpression = await this.perspective.getExpression(sparqlResult[0].embedding);
      return JSON.parse(embeddingExpression.data);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.error('Error getting items embedding', error);
      return [];
    }
  }

  async allConversationEmbeddings(options?: AbortOptions): Promise<SynergyMatch[]> {
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

      const sparqlResult = await this.perspective.querySparql(sparqlQuery, options);

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
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.error('Error getting all conversation embedding', error);
      return [];
    }
  }

  async allSubgroupEmbeddings(options?: AbortOptions): Promise<SynergyMatch[]> {
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

      const sparqlResult = await this.perspective.querySparql(sparqlQuery, options);

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
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.error('Error getting all subgroup embedding', error);
      return [];
    }
  }

  async allItemEmbeddings(options?: AbortOptions): Promise<SynergyMatch[]> {
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

      const sparqlResult = await this.perspective.querySparql(sparqlQuery, options);

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
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.error('Error getting all item embedding', error);
      return [];
    }
  }

  async allItemEmbeddingsByType(itemType: string, options?: AbortOptions): Promise<SynergyMatch[]> {
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

      const sparqlResult = await this.perspective.querySparql(sparqlQuery, options);

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
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.error('Error getting item embeddings by type', error);
      return [];
    }
  }
}
