import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty, Literal } from "@coasys/ad4m";
import { SynergyMatch, SynergyTopic, ItemType, SearchType, FilterSettings } from "@coasys/flux-utils";

@SDNAClass({ name: "SemanticRelationship" })
export default class SemanticRelationship extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_semantic_relationship",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_expression",
    writable: true,
  })
  expression: string; // base url of expression

  @SubjectProperty({
    through: "flux://has_tag",
    writable: true,
    required: false,
  })
  tag: string; // base url of semantic tag

  @SubjectProperty({
    through: "flux://has_relevance",
    writable: true,
    resolveLanguage: "literal",
  })
  relevance: number; // 0 - 100

  channelFromItem = `
    % Find Channel that owns this Item
    subject_class("Channel", CH),
    instance(CH, ChannelId),
    triple(ChannelId, "ad4m://has_child", ItemId),
    property_getter(CH, ChannelId, "name", ChannelName),
  `;

  semanticRelationshipForItem = `
    % Find SemanticRelationship for Item
    subject_class("SemanticRelationship", SR),
    instance(SR, SemanticRelationship),
    property_getter(SR, SemanticRelationship, "expression", ItemId),
  `;

  emeddingFromSemanticRelationship = `
    % Get Embedding from SemanticRelationship
    property_getter(SR, SemanticRelationship, "tag", EmbeddingId),
    subject_class("Embedding", E),
    instance(E, EmbeddingId),
    property_getter(E, EmbeddingId, "embedding", Embedding)
  `;

  async itemEmbedding(itemId: string): Promise<number[]> {
    // get the embedding of a specific item
    try {
      const result = await this.perspective.infer(`
        ${this.semanticRelationshipForItem.replace("ItemId", `"${itemId}"`)}
        ${this.emeddingFromSemanticRelationship}.
      `);
      return result[0]?.Embedding ? JSON.parse(result[0].Embedding) : [];
    } catch (error) {
      console.error("Error getting items embedding", error);
      return [];
    }
  }

  async allConversationEmbeddings(): Promise<SynergyMatch[]> {
    // get all conversation embeddings in the perspective
    try {
      const result = await this.perspective.infer(`
        findall([ItemId, Embedding, ChannelId, ChannelName], (
          % 1. Find all Conversations
          subject_class("Conversation", Conversation),
          instance(Conversation, ItemId),

          ${this.channelFromItem}
          ${this.semanticRelationshipForItem}
          ${this.emeddingFromSemanticRelationship}
        ), Embeddings).
      `);

      return (result[0]?.Embeddings || []).map(([baseExpression, embedding, channelId, channelName]) => ({
        baseExpression,
        type: "Conversation",
        embedding: JSON.parse(embedding),
        channelId,
        channelName: Literal.fromUrl(channelName).get().data,
      }));
    } catch (error) {
      console.error("Error getting all conversation embedding", error);
      return [];
    }
  }

  async allSubgroupEmbeddings(): Promise<SynergyMatch[]> {
    // get all subgroup embeddings in the perspective
    try {
      const result = await this.perspective.infer(`
        findall([ItemId, Embedding, ChannelId, ChannelName], (
          % 1. Find all Subgroups
          subject_class("ConversationSubgroup", Subgroup),
          instance(Subgroup, ItemId),

          % 2. Find the parent Conversation
          subject_class("Conversation", CC),
          instance(CC, Conversation),
          triple(Conversation, "ad4m://has_child", ItemId),

          ${this.channelFromItem.replace("ItemId", "Conversation")}
          ${this.semanticRelationshipForItem}
          ${this.emeddingFromSemanticRelationship}
        ), Embeddings).
      `);

      return (result[0]?.Embeddings || []).map(([baseExpression, embedding, channelId, channelName]) => ({
        baseExpression,
        type: "Subgroup",
        embedding: JSON.parse(embedding),
        channelId,
        channelName: Literal.fromUrl(channelName).get().data,
      }));
    } catch (error) {
      console.error("Error getting all conversation embedding", error);
      return [];
    }
  }

  async allItemEmbeddings(): Promise<SynergyMatch[]> {
    // get all item embeddings in the perspective
    try {
      const result = await this.perspective.infer(`
        findall([ItemId, Type, Embedding, ChannelId, ChannelName], (
          % 1. Find all items of valid type
          (
            Type = "Message",
            subject_class("Message", MC),
            instance(MC, ItemId)
            ;
            Type = "Post",
            subject_class("Post", PC),
            instance(PC, ItemId)
            ;
            Type = "Task",
            subject_class("Task", TC),
            instance(TC, ItemId)
          ),

          ${this.channelFromItem}
          ${this.semanticRelationshipForItem}
          ${this.emeddingFromSemanticRelationship}
        ), Embeddings).
      `);

      return (result[0]?.Embeddings || []).map(([baseExpression, type, embedding, channelId, channelName]) => ({
        baseExpression,
        type,
        embedding: JSON.parse(embedding),
        channelId,
        channelName: Literal.fromUrl(channelName).get().data,
      }));
    } catch (error) {
      console.error("Error getting all conversation embedding", error);
      return [];
    }
  }

  async allItemEmbeddingsByType(itemType: string): Promise<SynergyMatch[]> {
    // get all item embeddings by type in the perspective
    try {
      const result = await this.perspective.infer(`
        findall([ItemId, Embedding, ChannelId, ChannelName], (
          % 1. Find all items of valid type
          subject_class("${itemType.slice(0, -1)}", TypeClass),
          instance(TypeClass, ItemId),

          ${this.channelFromItem}
          ${this.semanticRelationshipForItem}
          ${this.emeddingFromSemanticRelationship}
        ), Embeddings).
      `);

      return (result[0]?.Embeddings || []).map(([baseExpression, embedding, channelId, channelName]) => ({
        baseExpression,
        type: itemType,
        embedding: JSON.parse(embedding),
        channelId,
        channelName: Literal.fromUrl(channelName).get().data,
      }));
    } catch (error) {
      console.error("Error getting all conversation embedding", error);
      return [];
    }
  }
}
