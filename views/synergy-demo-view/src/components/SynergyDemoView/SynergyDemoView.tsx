import { LinkQuery } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import { findRelationships, findTopics, getAllTopics } from "@coasys/flux-utils";
import EmbeddingWorker from "@coasys/flux-utils/src/embeddingWorker?worker&inline";
import WebRTCView from "@coasys/flux-webrtc-view/src/App";
import { useEffect, useRef, useState } from "preact/hooks";
import Match from "../Match/Match";
import Timeline from "../Timeline";
import styles from "./SynergyDemoView.module.scss";

type Props = {
  perspective: any;
  source: string;
  agent: AgentClient;
};

const filterOptions = ["Conversations", "Subgroups", "Items"];

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [openAIKey, setOpenAIKey] = useState(localStorage?.getItem("openAIKey") || "");
  const [matches, setMatches] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState("Conversations");
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
    const embedding = Float32Array.from(Object.values(JSON.parse(expression.data).data));
    return embedding;
  }

  async function findTopicMatches(subjectClass: string, sourceTopic: string): Promise<any[]> {
    // searches for items of the subject class with matching topics in the channel
    return await new Promise(async (resolveMatches: any) => {
      const newMatches = [];
      const items = await new SubjectRepository(subjectClass, {
        perspective,
        source,
      }).getAllData();
      Promise.all(
        items.map(
          (item: any) =>
            new Promise(async (resolve: any) => {
              const relationships = await findRelationships(perspective, item.id);
              const topics = await findTopics(perspective, relationships);
              const match = topics.find((topic) => topic.name === sourceTopic);
              if (match)
                newMatches.push({
                  channel: { id: source },
                  itemId: item.id,
                  relevance: match.relevance,
                });
              resolve();
            })
        )
      )
        .then(() => resolveMatches(newMatches))
        .catch((error) => {
          console.log(error);
          resolveMatches([]);
        });
    });
  }

  function entryTypeToSubjectClass(entryType: string) {
    if (entryType === "flux://conversation") return "Conversation";
    else if (entryType === "flux://conversation_subgroup") return "ConversationSubgroup";
    else if (entryType === "flux://has_message") return "Message";
    else if (entryType === "flux://has_post") return "Post";
    else return "Task"; // todo: find way to identify tasks without entry type flags
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
    return channels.find((c) => parentLinks.find((p) => p.data.source === c.id));
  }

  async function findEmbeddingMatches(itemId: string, allowedTypes: string[]): Promise<any[]> {
    // searches for items in the neighbourhood with similar embedding scores & matching the search filters
    return await new Promise(async (resolveMatches: any) => {
      const sourceEmbedding = await findEmbedding(itemId);
      const embeddingLinks = await perspective.get(
        new LinkQuery({ predicate: "ad4m://embedding" })
      );
      const channels = (await new SubjectRepository(Channel, {
        perspective,
      }).getAllData()) as any;
      const itemsWithEmbeddings = await Promise.all(
        embeddingLinks.map(async (link: any) => {
          const channel = await findChannel(link.data.source, channels);
          const type = await findEntryType(link.data.source);
          // if it doesn't match the search filters return null
          if (channel.id === source || !allowedTypes.includes(type)) return null;
          else {
            // otherwise grab the required data linked to the item
            const expression = await perspective.getExpression(link.data.target);
            const embedding = Float32Array.from(Object.values(JSON.parse(expression.data).data));
            return {
              id: link.data.source,
              author: expression.author,
              timestamp: expression.timestamp,
              channel,
              type,
              embedding,
            };
          }
        })
      );
      // generate similarity score for items
      const embeddingWorker = new EmbeddingWorker();
      embeddingWorker.onmessage = async (message) => {
        const { type, items } = message.data;
        if (type === "similarity") {
          resolveMatches(items);
          worker.current?.terminate();
        }
      };
      embeddingWorker.postMessage({
        type: "similarity",
        items: itemsWithEmbeddings.filter((i) => i !== null),
        sourceEmbedding,
      });
    });
  }

  async function search(type: string, id: string) {
    setSearching(true);
    setMatches([]);
    setSearchType(type);
    setSearchId(id);
    setSelectedTopic(type === "topic" ? id : "");
    const entryTypes = [];
    if (filter === "Conversations") entryTypes.push("Conversation");
    if (filter === "Subgroups") entryTypes.push("ConversationSubgroup");
    if (filter === "Items") entryTypes.push("Message", "Post", "Task");
    let newMatches = [];
    if (type === "topic") {
      // todo: handle topics
    } else {
      newMatches = await findEmbeddingMatches(id, entryTypes);
    }
    const sortedMatches = newMatches.sort((a, b) => b.score - a.score);
    setMatches(sortedMatches);
    setSearching(false);
  }

  function matchText() {
    if (!searchType) return "";
    if (searching) return "Searching for matches...";
    if (matches.length === 0)
      return `No ${searchType} matches ${searchType === "topic" ? `for #${selectedTopic}` : ""}`;
    return `${matches.length} ${searchType} match${matches.length > 1 ? "es" : ""} ${searchType === "topic" ? `for #${selectedTopic}` : ""}`;
  }

  useEffect(() => {
    getAllTopics(perspective).then((topics: any[]) => setAllTopics(topics));
  }, []);

  // update search results on filter changes
  useEffect(() => {
    if (searchId) search(searchType, searchId);
  }, [filter]);

  // reset matches when channel changes
  useEffect(() => setMatches([]), [source]);

  return (
    <div className={styles.wrapper}>
      <j-text uppercase size="500" weight="800" color="primary-500">
        Synergy Demo
      </j-text>
      <j-box mb="400">
        <j-input
          label="OpenAI Key"
          value={openAIKey}
          placeholder="Required to process content..."
          onInput={(event) => {
            const value = (event.target as HTMLInputElement).value;
            setOpenAIKey(value);
            localStorage?.setItem("openAIKey", value);
          }}
        />
      </j-box>
      <j-flex gap="400" wrap style={{ width: "100%" }}>
        All topics:
        {allTopics.map((t) => (
          <j-text nomargin>#{t.name}</j-text>
        ))}
      </j-flex>
      <j-flex className={styles.content}>
        <div className={styles.timelineColumn}>
          <Timeline
            agent={agent}
            perspective={perspective}
            index={0}
            channelId={source}
            selectedTopic={selectedTopic}
            search={search}
          />
        </div>
        <div id="video-wall" className={styles.videoColumn}>
          <WebRTCView
            perspective={perspective}
            source={source}
            agent={agent}
            currentView="@coasys/flux-synergy-demo-view"
            setModalOpen={() => null}
          />
        </div>
        <j-flex direction="column" gap="500" className={styles.matchColumn}>
          {/* Todo: create Matches component */}
          <div className={styles.header}>
            <j-flex gap="500">
              {filterOptions.map((option) => (
                <j-checkbox checked={filter === option} onChange={() => setFilter(option)}>
                  {option}
                </j-checkbox>
              ))}
            </j-flex>
            <h2>{matchText()}</h2>
          </div>
          <j-flex direction="column" gap="400" className={styles.results}>
            {matches.map((match) => (
              <Match key={match.id} perspective={perspective} agent={agent} match={match} />
            ))}
          </j-flex>
        </j-flex>
      </j-flex>
    </div>
  );
}
