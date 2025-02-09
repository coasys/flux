import { Literal } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Conversation, ConversationSubgroup, Embedding, SemanticRelationship, Topic } from "@coasys/flux-api";
import { getAllTopics } from "@coasys/flux-utils";
import WebRTCView from "@coasys/flux-webrtc-view/src/App";
import { cos_sim } from "@xenova/transformers";
import { useEffect, useState } from "preact/hooks";
import MatchColumn from "../MatchColumn";
import TimelineColumn from "../TimelineColumn";
import styles from "./SynergyDemoView.module.scss";
import { SynergyMatch, SynergyTopic, ItemType, SearchType, FilterSettings } from "@coasys/flux-utils";

type Props = { perspective: any; source: string; agent: AgentClient };

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [matches, setMatches] = useState<SynergyMatch[]>([]);
  const [allTopics, setAllTopics] = useState<SynergyTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<SynergyTopic | null>(null);
  const [searchItemId, setSearchItemId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("");
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    grouping: "Conversations",
    itemType: "All Types",
    includeChannel: false,
  });
  const [showMatchColumn, setShowMatchColumn] = useState(false);

  async function getSourceEmbeddings(itemId: string) {
    const result = await perspective.infer(`
      % 1. Find SemanticRelationship for this item
      subject_class("SemanticRelationship", SR),
      instance(SR, Relationship),
      property_getter(SR, Relationship, "expression", "${itemId}"),

      % 2. Get Embedding ID from relationship
      triple(Relationship, "flux://has_tag", EmbeddingId),

      % 3. Get Embedding data
      subject_class("Embedding", E),
      instance(E, EmbeddingId),
      property_getter(E, EmbeddingId, "embedding", Embedding).
    `);
    return result[0]?.Embedding ? JSON.parse(result[0].Embedding) : null;
  }

  async function getAllConversationEmbeddings(): Promise<SynergyMatch[]> {
    const result = await perspective.infer(`
      findall([ItemId, Embedding, ChannelId, ChannelName], (
        % 1. Find all Conversations
        subject_class("Conversation", Conversation),
        instance(Conversation, ItemId),
    
        % 2. Find Channel that owns this Conversation
        subject_class("Channel", CH),
        instance(CH, ChannelId),
        triple(ChannelId, "ad4m://has_child", ItemId),
        property_getter(CH, ChannelId, "name", ChannelName),
    
        % 3. Find SemanticRelationship for this Conversation
        subject_class("SemanticRelationship", SR),
        instance(SR, SemanticRelationship),
        property_getter(SR, SemanticRelationship, "expression", ItemId),
    
        % 4. Get Embedding ID from relationship
        triple(SemanticRelationship, "flux://has_tag", EmbeddingId),
    
        % 5. Finally get Embedding data
        subject_class("Embedding", E),
        instance(E, EmbeddingId),
        property_getter(E, EmbeddingId, "embedding", Embedding)
      ), Embeddings).
    `);

    return (result[0]?.Embeddings || []).map(([baseExpression, embedding, channelId, channelName]) => ({
      baseExpression,
      type: "Conversation",
      embedding: JSON.parse(embedding),
      channelId,
      channelName: Literal.fromUrl(channelName).get().data,
    }));
  }

  async function getAllSubgroupEmbeddings(): Promise<SynergyMatch[]> {
    const result = await perspective.infer(`
      findall([ItemId, Embedding, ChannelId, ChannelName], (
        % 1. Find all Subgroups
        subject_class("ConversationSubgroup", Subgroup),
        instance(Subgroup, ItemId),
    
        % 2. Find the parent Conversation
        subject_class("Conversation", CC),
        instance(CC, Conversation),
        triple(Conversation, "ad4m://has_child", ItemId),
    
        % 3. Find Channel that owns Conversation
        subject_class("Channel", CH),
        instance(CH, ChannelId),
        triple(ChannelId, "ad4m://has_child", Conversation),
        property_getter(CH, ChannelId, "name", ChannelName),
    
        % 4. Find SemanticRelationship for this Subgroup
        subject_class("SemanticRelationship", SR),
        instance(SR, SemanticRelationship),
        property_getter(SR, SemanticRelationship, "expression", ItemId),
    
        % 5. Get Embedding ID and data
        triple(SemanticRelationship, "flux://has_tag", EmbeddingId),
        subject_class("Embedding", E),
        instance(E, EmbeddingId),
        property_getter(E, EmbeddingId, "embedding", Embedding)
      ), Embeddings).
    `);

    return (result[0]?.Embeddings || []).map(([baseExpression, embedding, channelId, channelName]) => ({
      baseExpression,
      type: "Subgroup",
      embedding: JSON.parse(embedding),
      channelId,
      channelName: Literal.fromUrl(channelName).get().data,
    }));
  }

  async function getAllItemEmbeddings(): Promise<SynergyMatch[]> {
    const result = await perspective.infer(`
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
  
        % 2. Find Channel that owns this Item
        subject_class("Channel", CH),
        instance(CH, ChannelId),
        triple(ChannelId, "ad4m://has_child", ItemId),
        property_getter(CH, ChannelId, "name", ChannelName),
  
        % 3. Find SemanticRelationship for this Item
        subject_class("SemanticRelationship", SR),
        instance(SR, Relationship),
        property_getter(SR, Relationship, "expression", ItemId),
  
        % 4. Get Embedding data
        property_getter(SR, Relationship, "tag", EmbeddingId),
        subject_class("Embedding", E),
        instance(E, EmbeddingId),
        property_getter(E, EmbeddingId, "embedding", Embedding)
      ), Embeddings).
    `);

    return (result[0]?.Embeddings || []).map(([baseExpression, type, embedding, channelId, channelName]) => ({
      baseExpression,
      type,
      embedding: JSON.parse(embedding),
      channelId,
      channelName: Literal.fromUrl(channelName).get().data,
    }));
  }

  async function getItemEmbeddings(itemType: ItemType): Promise<SynergyMatch[]> {
    const result = await perspective.infer(`
      findall([ItemId, Embedding, ChannelId, ChannelName], (
        % 1. Find all items of valid type
        subject_class("${itemType.slice(0, -1)}", TypeClass),
        instance(TypeClass, ItemId),
  
        % 2. Find Channel that owns this Item
        subject_class("Channel", CH),
        instance(CH, ChannelId),
        triple(ChannelId, "ad4m://has_child", ItemId),
        property_getter(CH, ChannelId, "name", ChannelName),
  
        % 3. Find SemanticRelationship for this Item
        subject_class("SemanticRelationship", SR),
        instance(SR, Relationship),
        property_getter(SR, Relationship, "expression", ItemId),
  
        % 4. Get Embedding data
        property_getter(SR, Relationship, "tag", EmbeddingId),
        subject_class("Embedding", E),
        instance(E, EmbeddingId),
        property_getter(E, EmbeddingId, "embedding", Embedding)
      ), Embeddings).
    `);

    return (result[0]?.Embeddings || []).map(([baseExpression, embedding, channelId, channelName]) => ({
      baseExpression,
      type: itemType,
      embedding: JSON.parse(embedding),
      channelId,
      channelName: Literal.fromUrl(channelName).get().data,
    }));
  }

  async function findEmbeddingMatches(itemId: string): Promise<SynergyMatch[]> {
    // searches for items in the neighbourhood that match the search filters & have similar embedding scores
    const sourceEmbedding = await getSourceEmbeddings(itemId);
    let allEmbeddings = [];
    const { grouping, itemType } = filterSettings;
    if (grouping === "Conversations") allEmbeddings = await getAllConversationEmbeddings();
    if (grouping === "Subgroups") allEmbeddings = await getAllSubgroupEmbeddings();
    if (grouping === "Items") {
      if (itemType === "All Types") allEmbeddings = await getAllItemEmbeddings();
      else allEmbeddings = await getItemEmbeddings(itemType);
    }
    const matches = await Promise.all(
      allEmbeddings.map(async (e: any) => {
        const { baseExpression, type, embedding, channelId, channelName } = e;
        // filter out results that don't match the search filters
        const isSourceItem = baseExpression === itemId;
        const wrongChannel = !filterSettings.includeChannel && channelId === source;
        if (isSourceItem || wrongChannel) return null;
        // generate a similarity score for the embedding
        const score = await cos_sim(sourceEmbedding, embedding);
        return { baseExpression, channelId, channelName, type, score };
      })
    );
    return matches.filter((item) => item && item.score > 0.2);
  }

  function topicMatchQuery(type: "Conversation" | "Subgroup", topicId: string): string {
    // same prolog query required for conversation & subgroup topic matches, except for the type
    return `
      findall([${type}, Relevance, Channel, ChannelName], (
        % 1. Find SemanticRelationships that have tag = topicId
        subject_class("SemanticRelationship", SR),
        instance(SR, Relationship),
        triple(Relationship, "flux://has_tag", "${topicId}"),
  
        % 2. Grab the subgroup and relevance
        property_getter(SR, Relationship, "expression", Subgroup),
        property_getter(SR, Relationship, "relevance", Relevance),
  
        % 3. Find the parent Conversation that owns this Subgroup
        subject_class("Conversation", CC),
        instance(CC, Conversation),
        triple(Conversation, "ad4m://has_child", Subgroup),
  
        % 4. Find the Channel that owns this Conversation
        subject_class("Channel", CH),
        instance(CH, Channel),
        triple(Channel, "ad4m://has_child", Conversation),
  
        % 5. Grab the Channel's name property
        property_getter(CH, Channel, "name", ChannelName)
      ), Matches).
    `;
  }

  async function getConversationTopicMatches(topicId): Promise<SynergyMatch[]> {
    const result = await perspective.infer(topicMatchQuery("Conversation", topicId));
    // remove duplicate conversations
    const rows = result[0]?.Matches || [];
    const dedupMap: Record<string, any> = {};
    for (const [baseExpression, relevance, channelId, channelName] of rows) {
      if (!dedupMap[baseExpression]) {
        // convert prolog response to JS
        dedupMap[baseExpression] = {
          baseExpression,
          type: "Conversation",
          relevance: parseInt(Literal.fromUrl(relevance).get().data, 10),
          channelId,
          channelName: Literal.fromUrl(channelName).get().data,
        };
      }
    }
    return Object.values(dedupMap);
  }

  async function getSubgroupTopicMatches(topicId): Promise<SynergyMatch[]> {
    const result = await perspective.infer(topicMatchQuery("Subgroup", topicId));
    return (result[0]?.Matches || []).map(([baseExpression, relevance, channelId, channelName]) => ({
      // convert prolog response to JS
      baseExpression,
      type: "ConversationSubgroup",
      relevance: parseInt(Literal.fromUrl(relevance).get().data, 10),
      channelId,
      channelName: Literal.fromUrl(channelName).get().data,
    }));
  }

  // searches for items in the neighbourhood that match the search filters & are linked to the same topic
  async function findTopicMatches(itemId: string, topicId: string): Promise<SynergyMatch[]> {
    // update grouping if set to Items (no longer works with topics)
    const { grouping } = filterSettings;
    let currentGrouping = grouping === "Items" ? "Conversations" : grouping;
    if (grouping === "Items") setFilterSettings((prev) => ({ ...prev, grouping: "Conversations" }));
    // find matches
    const matches =
      currentGrouping === "Conversations"
        ? await getConversationTopicMatches(topicId)
        : await getSubgroupTopicMatches(topicId);
    // filter out results that don't match the search filters
    const filteredMatches = matches.map((relationship) => {
      const { baseExpression, type, channelId, channelName, relevance } = relationship;
      const isSourceItem = baseExpression === itemId;
      const wrongChannel = !filterSettings.includeChannel && channelId === source;
      if (isSourceItem || wrongChannel) return null;
      return { baseExpression, channelId, channelName, type, score: relevance / 100 };
    });

    return filteredMatches.filter((i) => i !== null);
  }

  async function search(type: SearchType, itemId: string, topic?: SynergyTopic) {
    setSearching(true);
    setMatches([]);
    setShowMatchColumn(true);
    setSearchType(type);
    setSearchItemId(itemId);
    setSelectedTopic(type === "topic" ? topic : null);
    const newMatches =
      type === "topic" ? await findTopicMatches(itemId, topic.baseExpression) : await findEmbeddingMatches(itemId);
    const sortedMatches = newMatches.sort((a, b) => b.score - a.score);
    setMatches(sortedMatches);
    setSearching(false);
  }

  function matchText(): string {
    if (!searchType) return "";
    if (searching) return "Searching for matches...";
    if (matches.length === 0)
      return `No ${searchType} matches ${searchType === "topic" ? `for #${selectedTopic.name}` : ""}`;
    return `${matches.length} match${matches.length > 1 ? "es" : ""} ${searchType === "topic" ? `for #${selectedTopic.name}` : ""}`;
  }

  // get all topic tags on page load
  useEffect(() => {
    getAllTopics(perspective).then((topics: SynergyTopic[]) => setAllTopics(topics));
  }, []);

  // update search results when filters change
  useEffect(() => {
    if (searchItemId && searchType) search(searchType, searchItemId, selectedTopic);
  }, [filterSettings]);

  // reset matches when channel changes
  useEffect(() => setMatches([]), [source]);

  // temp: ensure SDNA classes
  useEffect(() => {
    perspective.ensureSDNASubjectClass(Conversation);
    perspective.ensureSDNASubjectClass(ConversationSubgroup);
    perspective.ensureSDNASubjectClass(Topic);
    perspective.ensureSDNASubjectClass(Embedding);
    perspective.ensureSDNASubjectClass(SemanticRelationship);
    console.log("SNDA classes ensured");
  }, []);

  return (
    <div className={styles.wrapper}>
      <j-text uppercase size="500" weight="800" color="primary-500">
        Synergy Demo
      </j-text>
      <j-flex gap="400" wrap style={{ width: "100%" }}>
        All topics:
        {allTopics.map((t) => (
          <j-text nomargin>#{t.name}</j-text>
        ))}
      </j-flex>
      <j-flex className={styles.content}>
        <div
          style={{
            width: showMatchColumn ? "33%" : "50%",
            transition: "width 0.5s ease-in-out",
          }}
        >
          <TimelineColumn
            agent={agent}
            perspective={perspective}
            channelId={source}
            selectedTopicId={selectedTopic?.baseExpression || ""}
            search={search}
          />
        </div>
        <div
          style={{
            width: showMatchColumn ? "33%" : "50%",
            transition: "width 0.5s ease-in-out",
          }}
        >
          <WebRTCView
            perspective={perspective}
            source={source}
            agent={agent}
            currentView="@coasys/flux-synergy-demo-view"
          />
        </div>
        <div
          style={{
            width: showMatchColumn ? "33%" : "0%",
            opacity: showMatchColumn ? "1" : "0",
            pointerEvents: showMatchColumn ? "all" : "none",
            transition: "all 0.5s ease-in-out",
          }}
        >
          <MatchColumn
            perspective={perspective}
            agent={agent}
            matches={matches}
            selectedTopicId={selectedTopic?.baseExpression || ""}
            searchType={searchType}
            filterSettings={filterSettings}
            setFilterSettings={setFilterSettings}
            matchText={matchText}
            close={() => setShowMatchColumn(false)}
          />
        </div>
      </j-flex>
    </div>
  );
}
