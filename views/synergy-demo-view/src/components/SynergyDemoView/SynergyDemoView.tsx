import { LinkQuery } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import { getAllTopics } from "@coasys/flux-utils";
import EmbeddingWorker from "@coasys/flux-utils/src/embeddingWorker?worker&inline";
import WebRTCView from "@coasys/flux-webrtc-view/src/App";
import { useEffect, useRef, useState } from "preact/hooks";
import MatchColumn from "../MatchColumn";
import TimelineColumn from "../TimelineColumn";
import styles from "./SynergyDemoView.module.scss";

type Props = {
  perspective: any;
  source: string;
  agent: AgentClient;
};

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [matches, setMatches] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>({});
  const [searchItem, setSearchItem] = useState<any>({});
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [filterSettings, setFilterSettings] = useState({
    grouping: "Conversations",
    itemType: "All Types",
    includeChannel: false,
  });
  const worker = useRef<Worker | null>(null);

  async function findEmbedding(itemId) {
    const links = await perspective.get(
      new LinkQuery({
        source: itemId,
        predicate: "ad4m://embedding",
      })
    );
    if (!links.length) return null;
    const expression = await perspective.getExpression(links[0].data.target);
    return Float32Array.from(Object.values(JSON.parse(expression.data).data));
  }

  function entryTypeToSubjectClass(entryType: string) {
    if (entryType === "flux://conversation") return "Conversation";
    else if (entryType === "flux://conversation_subgroup")
      return "ConversationSubgroup";
    else if (entryType === "flux://has_message") return "Message";
    else if (entryType === "flux://has_post") return "Post";
    else return "Unknown";
  }

  async function findEntryType(itemId) {
    const entryTypeLink = await perspective.get(
      new LinkQuery({ source: itemId, predicate: "flux://entry_type" })
    );
    if (!entryTypeLink[0]) return "Task";
    else return entryTypeToSubjectClass(entryTypeLink[0].data.target);
  }

  async function findChannel(itemId, channels) {
    const parentLinks = await perspective.get(
      new LinkQuery({ predicate: "ad4m://has_child", target: itemId })
    );
    return (
      channels.find((c) => parentLinks.find((p) => p.data.source === c.id)) || {
        id: "unlinked",
      }
    );
  }

  async function findEmbeddingMatches(
    itemId: string,
    allowedTypes: string[],
    channels: any[]
  ): Promise<any[]> {
    // searches for items in the neighbourhood that match the search filters & have similar embedding scores
    return await new Promise(async (resolveMatches: any) => {
      const sourceEmbedding = await findEmbedding(itemId);
      const embeddingLinks = await perspective.get(
        new LinkQuery({ predicate: "ad4m://embedding" })
      );
      const results = await Promise.all(
        embeddingLinks.map(async (link: any) => {
          const channel = await findChannel(link.data.source, channels);
          const type = await findEntryType(link.data.source);
          // if it doesn't match the search filters return null
          const wrongChannel =
            !filterSettings.includeChannel && channel.id === source;
          const wrongType = !allowedTypes.includes(type);
          if (wrongChannel || wrongType) return null;
          // otherwise grab the required data linked to the item
          const expression = await perspective.getExpression(link.data.target);
          const embedding = Float32Array.from(
            Object.values(JSON.parse(expression.data).data)
          );
          return { id: link.data.source, channel, type, embedding };
        })
      );
      // generate similarity score for items
      const embeddingWorker = new EmbeddingWorker();
      embeddingWorker.onmessage = async (message) => {
        resolveMatches(message.data);
        worker.current?.terminate();
      };
      embeddingWorker.postMessage({
        items: results.filter((i) => i !== null),
        sourceEmbedding,
      });
    });
  }

  async function findTopicMatches(
    topicId: string,
    allowedTypes: string[],
    channels: any[]
  ): Promise<any[]> {
    // searches for items in the neighbourhood that match the search filters & are linked to the same topic
    return await new Promise(async (resolveMatches: any) => {
      // grab all topic links
      const topicLinks = await perspective.get(
        new LinkQuery({ predicate: "flux://has_tag" })
      );
      const results = await Promise.all(
        topicLinks.map(async (t) => {
          const { data } = await perspective.getExpression(t.data.target);
          // filter out other topics
          if (!data.includes(topicId)) return null;
          // get relationship data
          const relationshipProxy = await perspective.getSubjectProxy(
            t.data.source,
            "SemanticRelationship"
          );
          const expressionId = await relationshipProxy.expression;
          const channel = await findChannel(expressionId, channels);
          const type = await findEntryType(expressionId);
          // if it doesn't match the search filters return null
          const wrongChannel =
            !filterSettings.includeChannel && channel.id === source;
          const wrongType = !allowedTypes.includes(type);
          if (wrongChannel || wrongType) return null;
          return {
            id: expressionId,
            channel,
            type,
            score: (await relationshipProxy.relevance) / 100,
          };
        })
      );
      resolveMatches(results.filter((i) => i !== null));
    });
  }

  function findAllowedTypes() {
    const allowedTypes = [];
    const { grouping, itemType } = filterSettings;
    if (grouping === "Conversations") allowedTypes.push("Conversation");
    else if (grouping === "Subgroups")
      allowedTypes.push("ConversationSubgroup");
    else if (grouping === "Items") {
      if (itemType === "All Types")
        allowedTypes.push("Message", "Post", "Task");
      else if (itemType === "Messages") allowedTypes.push("Message");
      else if (itemType === "Posts") allowedTypes.push("Post");
      else if (itemType === "Tasks") allowedTypes.push("Task");
    }
    return allowedTypes;
  }

  async function search(type: string, item: any) {
    setSearching(true);
    setMatches([]);
    setSearchType(type);
    setSearchItem(item);
    setSelectedTopic(type === "topic" ? item : {});
    const allowedTypes = findAllowedTypes();
    const channels = (await new SubjectRepository(Channel, {
      perspective,
    }).getAllData()) as any;
    const newMatches =
      type === "topic"
        ? await findTopicMatches(item.id, allowedTypes, channels)
        : await findEmbeddingMatches(item.id, allowedTypes, channels);
    const sortedMatches = newMatches.sort((a, b) => b.score - a.score);
    setMatches(sortedMatches);
    setSearching(false);
  }

  function matchText() {
    if (!searchType) return "";
    if (searching) return "Searching for matches...";
    if (matches.length === 0)
      return `No ${searchType} matches ${searchType === "topic" ? `for #${selectedTopic.name}` : ""}`;
    return `${matches.length} match${matches.length > 1 ? "es" : ""} ${searchType === "topic" ? `for #${selectedTopic.name}` : ""}`;
  }

  // get all topic tags on page load
  useEffect(() => {
    getAllTopics(perspective).then((topics: any[]) => setAllTopics(topics));
  }, []);

  // update search results when filters change
  useEffect(() => {
    if (searchItem.id) search(searchType, searchItem);
  }, [filterSettings]);

  // reset matches when channel changes
  useEffect(() => setMatches([]), [source]);

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
        <TimelineColumn
          agent={agent}
          perspective={perspective}
          channelId={source}
          selectedTopicId={selectedTopic.id}
          search={search}
        />
        <div style={{ width: "33%" }}>
          <WebRTCView
            perspective={perspective}
            source={source}
            agent={agent}
            currentView="@coasys/flux-synergy-demo-view"
            setModalOpen={() => null}
          />
        </div>
        <MatchColumn
          perspective={perspective}
          agent={agent}
          matches={matches}
          selectedTopicId={selectedTopic.id}
          filterSettings={filterSettings}
          setFilterSettings={setFilterSettings}
          matchText={matchText}
        />
      </j-flex>
    </div>
  );
}
