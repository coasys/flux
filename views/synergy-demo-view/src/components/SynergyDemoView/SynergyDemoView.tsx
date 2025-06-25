import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Conversation, ConversationSubgroup, Embedding, SemanticRelationship, Topic } from "@coasys/flux-api";
import { Profile, SignallingService } from "@coasys/flux-types";
import { FilterSettings, SearchType, SynergyMatch, SynergyTopic } from "@coasys/flux-utils";
import { cos_sim } from "@xenova/transformers";
import { useEffect, useState } from "preact/hooks";
import MatchColumn from "../MatchColumn";
import TimelineColumn from "../TimelineColumn";
import styles from "./SynergyDemoView.module.scss";

type Props = {
  perspective: any;
  source: string;
  agent: AgentClient;
  appStore: any;
  aiStore: any;
  signallingService: SignallingService;
  getProfile: (did: string) => Promise<Profile>;
};

export default function SynergyDemoView({
  perspective,
  agent,
  source,
  appStore,
  aiStore,
  signallingService,
  getProfile,
}: Props) {
  const [matches, setMatches] = useState<SynergyMatch[]>([]);
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
  const [signalsHealthy, setSignalsHealthy] = useState(true);
  const [showLLMInfoModal, setShowLLMInfoModal] = useState(false);

  async function findEmbeddingMatches(itemId: string): Promise<SynergyMatch[]> {
    // Searches for items in the neighbourhood that match the search filters & have similar embedding scores
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
        // Filter out results that don't match the search filters
        const isSourceItem = baseExpression === itemId;
        const wrongChannel = !filterSettings.includeChannel && channelId === source;
        if (isSourceItem || wrongChannel) return null;
        // Generate a similarity score for the embedding
        const score = await cos_sim(sourceEmbedding, embedding);
        return { baseExpression, channelId, channelName, type, score };
      })
    );
    return matches.filter((item) => item && item.score > 0.2);
  }

  async function findTopicMatches(itemId: string, topicId: string): Promise<SynergyMatch[]> {
    const { grouping } = filterSettings;
    // Todo: remove option for "Items" grouping so this isn't necissary
    // If the grouping is "Items", we need to change it to "Conversations" as topics no longer have topic tags
    let currentGrouping = grouping === "Items" ? "Conversations" : grouping;
    if (grouping === "Items") setFilterSettings((prev) => ({ ...prev, grouping: "Conversations" }));
    // Find matches
    const topic = new Topic(perspective, topicId);
    const matches =
      currentGrouping === "Conversations" ? await topic.linkedConversations() : await topic.linkedSubgroups();
    // Filter out results that don't match the search filters
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

  useEffect(() => {
    // Ensure SDNA classes
    perspective.ensureSDNASubjectClass(Conversation);
    perspective.ensureSDNASubjectClass(ConversationSubgroup);
    perspective.ensureSDNASubjectClass(Topic);
    perspective.ensureSDNASubjectClass(Embedding);
    perspective.ensureSDNASubjectClass(SemanticRelationship);

    // Listen for call health updates from the signalling service
    const eventName = `${perspective.uuid}-call-health-update`;
    const handleCallHealthUpdate = (event: CustomEvent) => setSignalsHealthy(event.detail === "healthy");
    window.addEventListener(eventName, handleCallHealthUpdate);
    return () => window.removeEventListener(eventName, handleCallHealthUpdate);
  }, []);

  // Update search results when filters change
  useEffect(() => {
    if (searchItemId && searchType) search(searchType, searchItemId, selectedTopic);
  }, [filterSettings]);

  // Reset matches when channel changes
  useEffect(() => setMatches([]), [source]);

  return (
    <div className={styles.wrapper}>
      <j-flex gap="500" a="center" wrap>
        <j-text nomargin uppercase size="600" weight="800" color="primary-500">
          Synergy
        </j-text>

        {aiStore && (
          <j-flex a="center" gap="300">
            <j-icon name="robot" color="ui-500" />
            <j-text nomargin>LLM processing:</j-text>
            <j-text nomargin weight="800">
              {aiStore.defaultLLM ? (aiStore.defaultLLM.local ? "Localy" : "Remotely") : "Disabled"}
            </j-text>
            <j-icon
              name={aiStore.defaultLLM ? (aiStore.defaultLLM.local ? "house-fill" : "broadcast-pin") : "x-lg"}
              color="ui-500"
            />
            <j-icon
              name="info-circle"
              color="ui-500"
              onClick={() => setShowLLMInfoModal(true)}
              style={{ marginLeft: 20, cursor: "pointer" }}
            />
          </j-flex>
        )}

        {/* @ts-ignore */}
        <j-modal open={showLLMInfoModal} onToggle={(e) => setShowLLMInfoModal(e.target.open)}>
          {aiStore && (
            <j-box p="600">
              <j-flex a="center" direction="column" gap="400">
                <j-icon name="robot" size="xl" color="ui-500" />
                <j-flex a="center" gap="400">
                  <j-text uppercase nomargin color="primary-500" size="600">
                    LLM Settings
                  </j-text>
                  <j-icon
                    name="arrow-repeat"
                    color="ui-500"
                    onClick={() => aiStore.loadAIData()}
                    style={{ cursor: "pointer" }}
                  />
                </j-flex>

                <j-box my="400">
                  <j-text>
                    Open the Ad4m launcher and navigate to the AI tab to view and/or edit your selected models
                  </j-text>
                </j-box>

                <j-box my="400">
                  <j-flex a="center" gap="300">
                    <j-text nomargin>LLM processing:</j-text>
                    <j-text nomargin weight="800">
                      {aiStore.defaultLLM ? (aiStore.defaultLLM.local ? "Localy" : "Remotely") : "Disabled"}
                    </j-text>
                    <j-icon
                      name={aiStore.defaultLLM ? (aiStore.defaultLLM.local ? "house-fill" : "broadcast-pin") : "x-lg"}
                      color="ui-500"
                    />
                  </j-flex>
                </j-box>

                {aiStore.defaultLLM && (
                  <j-box>
                    {aiStore.defaultLLM.local ? (
                      <j-flex a="center" direction="column" gap="400">
                        {aiStore.llmLoadingStatus ? (
                          <>
                            <j-flex a="center" gap="300">
                              <j-text weight="800" nomargin>
                                Downloaded:
                              </j-text>
                              <j-text nomargin>{aiStore.llmLoadingStatus.downloaded}</j-text>
                            </j-flex>

                            <j-flex a="center" gap="300">
                              <j-text weight="800" nomargin>
                                Progress:
                              </j-text>
                              <j-text nomargin>{aiStore.llmLoadingStatus.progress}%</j-text>
                            </j-flex>

                            <j-flex a="center" gap="300">
                              <j-text weight="800" nomargin>
                                Status:
                              </j-text>
                              <j-text nomargin>{aiStore.llmLoadingStatus.status}</j-text>
                            </j-flex>
                          </>
                        ) : (
                          <j-text nomargin>No loading status available for local LLM</j-text>
                        )}

                        <j-flex a="center" gap="300">
                          <j-text weight="800" nomargin>
                            Model Name:
                          </j-text>
                          <j-text nomargin>{aiStore.defaultLLM.name}</j-text>
                        </j-flex>

                        <j-flex a="center" gap="300">
                          <j-text weight="800" nomargin>
                            File Name:
                          </j-text>
                          <j-text nomargin>{aiStore.defaultLLM.local.fileName}</j-text>
                        </j-flex>
                      </j-flex>
                    ) : (
                      <j-flex a="center" direction="column" gap="400">
                        <j-flex a="center" gap="300">
                          <j-text weight="800" nomargin>
                            API Type:
                          </j-text>
                          <j-text nomargin>{aiStore.defaultLLM.api.apiType}</j-text>
                        </j-flex>

                        <j-flex gap="300">
                          <j-text weight="800" nomargin>
                            API Key:
                          </j-text>
                          <j-text nomargin style={{ overflow: "hidden", maxWidth: 600, wordBreak: "break-all" }}>
                            {aiStore.defaultLLM.api.apiKey}
                          </j-text>
                        </j-flex>

                        <j-flex gap="300">
                          <j-text weight="800" nomargin>
                            Base URL:
                          </j-text>
                          <j-text nomargin>{aiStore.defaultLLM.api.baseUrl}</j-text>
                        </j-flex>

                        <j-flex gap="300">
                          <j-text weight="800" nomargin>
                            Model:
                          </j-text>
                          <j-text nomargin>{aiStore.defaultLLM.api.model}</j-text>
                        </j-flex>
                      </j-flex>
                    )}
                  </j-box>
                )}
              </j-flex>
            </j-box>
          )}
        </j-modal>
      </j-flex>

      {!signalsHealthy && (
        <j-badge variant="danger">
          <j-icon name="exclamation-triangle" style={{ marginRight: 10 }} />
          Holochain signals disrupted. Processing paused until connection restored.
        </j-badge>
      )}
      <j-flex className={styles.content}>
        <div
          style={{
            width: showMatchColumn ? "50%" : "100%",
            maxWidth: 1200,
            transition: "width 0.5s ease-in-out",
          }}
        >
          <TimelineColumn
            agent={agent}
            perspective={perspective}
            channelId={source}
            selectedTopicId={selectedTopic?.baseExpression || ""}
            signallingService={signallingService}
            signalsHealthy={signalsHealthy}
            appStore={appStore}
            aiStore={aiStore}
            search={search}
            getProfile={getProfile}
          />
        </div>
        <div
          style={{
            width: showMatchColumn ? "50%" : "0%",
            opacity: showMatchColumn ? "1" : "0",
            pointerEvents: showMatchColumn ? "all" : "none",
            transition: "all 0.5s ease-in-out",
            maxWidth: 1200,
            marginLeft: 40,
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
            getProfile={getProfile}
          />
        </div>
      </j-flex>
    </div>
  );
}
