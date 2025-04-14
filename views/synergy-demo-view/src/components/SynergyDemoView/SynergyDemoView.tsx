import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Conversation, ConversationSubgroup, Embedding, SemanticRelationship, Topic } from "@coasys/flux-api";
import WebRTCView from "@coasys/flux-webrtc-view/src/App";
import { cos_sim } from "@xenova/transformers";
import { useEffect, useState, useRef } from "preact/hooks";
import MatchColumn from "../MatchColumn";
import TimelineColumn from "../TimelineColumn";
import styles from "./SynergyDemoView.module.scss";
import { SynergyMatch, SynergyTopic, SearchType, FilterSettings } from "@coasys/flux-utils";
import { PerspectiveExpression } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";

const SIGNAL_TEST_TIMEOUT = 4000;
const SIGNAL_TEST_REQUEST = "hc-signal-test-request";
const SIGNAL_TEST_RESPONSE = "hc-signal-test-response";

type Props = { perspective: any; source: string; agent: AgentClient; appStore: any };

export default function SynergyDemoView({ perspective, agent, source, appStore }: Props) {
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
  const [allSignalsWorking, setAllSignalsWorking] = useState(true);
  const webrtcConnections = useRef<string[]>([]);
  const connectedAgents = useRef<string[]>([]);
  const signalCheckId = useRef<string>("");

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

  async function addSignalHandler() {
    const neighbourhood = await perspective.getNeighbourhoodProxy();
    const client = await getAd4mClient();
    const me = await client.agent.me();
    neighbourhood.addSignalHandler(async (expression: PerspectiveExpression) => {
      const link = expression.data.links[0];
      if (link.data.predicate === SIGNAL_TEST_REQUEST && link.data.target === me.did) {
        console.log(`Signal test request recieved from ${link.author}, responding...`);
        await neighbourhood.sendBroadcastU({ links: [{ source: link.data.source, predicate: SIGNAL_TEST_RESPONSE, target: link.author }] });
      }
      if (link.data.predicate === SIGNAL_TEST_RESPONSE && link.data.target === me.did) {
        console.log(`Signal test response recieved from ${link.author}`);
        if (link.data.source === signalCheckId.current) {
          console.log('Signal test success!')
          connectedAgents.current.push(link.author);
        } else {
          console.log(`Signal test failed: response from ${link.author} does not match the current request id ${signalCheckId.current}`);
        }
      }
    })
  }

  async function checkSignalsWorking(): Promise<boolean> {
    // if no webrtc connections, return true
    if (!webrtcConnections.current.length) {
      setAllSignalsWorking(true);
      return true;
    }

    // if signal check already in progress, return false
    if (signalCheckId.current) return false;

    console.log('Check holochain signals working for: ', webrtcConnections.current)
    // reset check id & connected agents
    signalCheckId.current = Math.random().toString(36).substring(2, 15);
    connectedAgents.current = [];

    // send holochain signals to all webrtc peers and wait for response
    const neighbourhood = await perspective.getNeighbourhoodProxy();
    const results = await Promise.all(webrtcConnections.current.map(async (connectionDid) => {
      await neighbourhood.sendBroadcastU({ links: [{ source: signalCheckId.current, predicate: SIGNAL_TEST_REQUEST, target: connectionDid }] })
      await new Promise(resolve => setTimeout(resolve, SIGNAL_TEST_TIMEOUT));
      if (connectedAgents.current.some((did) => did === connectionDid)) return true;
      return false;
    }));
    const allConnected = results.every((result) => result);
    console.log('All signals working:', allConnected);
    signalCheckId.current = "";
    setAllSignalsWorking(allConnected);
    return allConnected;
  }

  // update search results when filters change
  useEffect(() => {
    if (searchItemId && searchType) search(searchType, searchItemId, selectedTopic);
  }, [filterSettings]);

  // reset matches when channel changes
  useEffect(() => setMatches([]), [source]);

  useEffect(() => {
    addSignalHandler()
      // temp: ensure SDNA classes
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
      {!allSignalsWorking && (
        <j-badge variant="danger">
          <j-icon name="exclamation-triangle" style={{ marginRight: 10 }} />
          Holochain signals disrupted. Processing paused until connection restored.
        </j-badge>
      )}
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
            checkSignalsWorking={checkSignalsWorking}
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
            appStore={appStore}
            currentView="@coasys/flux-synergy-demo-view"
            webrtcConnections={webrtcConnections}
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
