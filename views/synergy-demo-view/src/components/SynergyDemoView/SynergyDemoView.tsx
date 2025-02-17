import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Conversation, ConversationSubgroup, Embedding, SemanticRelationship, Topic } from "@coasys/flux-api";
import { getAllTopics } from "@coasys/flux-utils";
import WebRTCView from "@coasys/flux-webrtc-view/src/App";
import { cos_sim } from "@xenova/transformers";
import { useEffect, useState } from "preact/hooks";
import MatchColumn from "../MatchColumn";
import TimelineColumn from "../TimelineColumn";
import styles from "./SynergyDemoView.module.scss";
import { SynergyMatch, SynergyTopic, SearchType, FilterSettings } from "@coasys/flux-utils";

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

  async function findEmbeddingMatches(itemId: string): Promise<SynergyMatch[]> {
    // searches for items in the neighbourhood that match the search filters & have similar embedding scores
    const semanticRelationship = new SemanticRelationship(perspective);
    const sourceEmbedding = await semanticRelationship.itemEmbedding(itemId);
    let allEmbeddings = [];
    const { grouping, itemType } = filterSettings;
    if (grouping === "Conversations") allEmbeddings = await semanticRelationship.allConversationEmbeddings();
    if (grouping === "Subgroups") allEmbeddings = await semanticRelationship.allSubgroupEmbeddings();
    if (grouping === "Items") {
      if (itemType === "All Types") allEmbeddings = await semanticRelationship.allItemEmbeddings();
      else allEmbeddings = await semanticRelationship.allItemEmbeddingsByType(itemType);
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

  async function findTopicMatches(itemId: string, topicId: string): Promise<SynergyMatch[]> {
    // update grouping if set to Items (no longer works with topics)
    const { grouping } = filterSettings;
    let currentGrouping = grouping === "Items" ? "Conversations" : grouping;
    if (grouping === "Items") setFilterSettings((prev) => ({ ...prev, grouping: "Conversations" }));
    // find matches
    const topic = new Topic(perspective, topicId);
    const matches =
      currentGrouping === "Conversations" ? await topic.linkedConversations() : await topic.linkedSubgroups();
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
