import { Model, Ad4mModel, Flag, Property } from '@coasys/ad4m';
import { parseLit } from '../utils/parseLit';
import { SynergyMatch } from '@coasys/flux-utils';

export class TopicWithRelevance {
  id: string;
  name: string;
  relevance: number;
}

@Model({ name: 'Topic' })
export default class Topic extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://has_topic' })
  type: string;

  @Property({ through: 'flux://topic' })
  topic: string;

  async linkedConversations(): Promise<SynergyMatch[]> {
    try {
      const sparqlQuery = `
        SELECT ?convId ?relevance ?channelId ?channelName WHERE {
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_tag> <${this.id}> .
          ?sr <flux://has_expression> ?subgroup .
          ?sr <flux://has_relevance> ?relevance .
          ?convId <ad4m://has_child> ?subgroup .
          ?convId <flux://entry_type> <flux://conversation> .
          ?channelId <ad4m://has_child> ?convId .
          ?channelId <flux://entry_type> <flux://has_channel> .
          ?channelId <flux://has_channel_name> ?channelName .
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by conversation ID
      const dedupMap = new Map<string, SynergyMatch>();
      for (const binding of sparqlResult || []) {
        const id = binding.convId;
        if (id && !dedupMap.has(id)) {
          dedupMap.set(id, {
            id,
            type: 'Conversation',
            relevance: parseInt(parseLit(binding.relevance), 10) || 0,
            channelId: binding.channelId,
            channelName: parseLit(binding.channelName),
          });
        }
      }
      return Array.from(dedupMap.values());
    } catch (error) {
      console.error('Error getting linked conversations:', error);
      return [];
    }
  }

  async linkedSubgroups(): Promise<SynergyMatch[]> {
    try {
      const sparqlQuery = `
        SELECT ?subgroup ?relevance ?channelId ?channelName WHERE {
          ?sr <flux://entry_type> <flux://has_semantic_relationship> .
          ?sr <flux://has_tag> <${this.id}> .
          ?sr <flux://has_expression> ?subgroup .
          ?sr <flux://has_relevance> ?relevance .
          ?conv <ad4m://has_child> ?subgroup .
          ?conv <flux://entry_type> <flux://conversation> .
          ?channelId <ad4m://has_child> ?conv .
          ?channelId <flux://entry_type> <flux://has_channel> .
          ?channelId <flux://has_channel_name> ?channelName .
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by subgroup ID
      const dedupMap = new Map<string, SynergyMatch>();
      for (const binding of sparqlResult || []) {
        const id = binding.subgroup;
        if (id && !dedupMap.has(id)) {
          dedupMap.set(id, {
            id,
            type: 'ConversationSubgroup',
            relevance: parseInt(parseLit(binding.relevance), 10) || 0,
            channelId: binding.channelId,
            channelName: parseLit(binding.channelName),
          });
        }
      }
      return Array.from(dedupMap.values());
    } catch (error) {
      console.error('Error getting linked subgroups:', error);
      return [];
    }
  }
}
