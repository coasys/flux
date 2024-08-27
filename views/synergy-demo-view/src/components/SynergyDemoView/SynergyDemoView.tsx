import { LinkQuery } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import {
  findRelationships,
  findTopics,
  getAllTopics,
} from "@coasys/flux-utils";
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

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [openAIKey, setOpenAIKey] = useState(
    localStorage?.getItem("openAIKey") || ""
  );
  const [matches, setMatches] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searching, setSearching] = useState(false);
  const worker = useRef<Worker | null>(null);

  async function findEmbedding(itemId) {
    const links = await perspective.get(
      new LinkQuery({
        source: itemId,
        predicate: "ad4m://embedding",
      })
    );
    if (links.length) {
      const expression = await perspective.getExpression(links[0].data.target);
      const embedding = Float32Array.from(
        Object.values(JSON.parse(expression.data).data)
      );
      return embedding;
    } else return null;
  }

  async function findTopicMatches(
    channel: any,
    subjectClass: string,
    sourceTopic: string
  ): Promise<any[]> {
    // searches for items of the subject class with matching topics in the channel
    return await new Promise(async (resolveMatches: any) => {
      const newMatches = [];
      const items = await new SubjectRepository(subjectClass, {
        perspective,
        source: channel.id,
      }).getAllData();
      Promise.all(
        items.map(
          (item: any) =>
            new Promise(async (resolve: any) => {
              const relationships = await findRelationships(
                perspective,
                item.id
              );
              const topics = await findTopics(perspective, relationships);
              const match = topics.find((topic) => topic.name === sourceTopic);
              if (match)
                newMatches.push({
                  channel,
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

  async function findEmbeddingMatches(
    channel: any,
    subjectClass: string,
    sourceEmbedding: any
  ): Promise<any[]> {
    // searches for items of the given subject class with similar vector embeddings in the channel
    return await new Promise(async (resolveMatches: any) => {
      const items = await new SubjectRepository(subjectClass, {
        perspective,
        source: channel.id,
      }).getAllData();
      // find embeddings for each item
      const itemsWithEmbedding = await Promise.all(
        items.map(async (item) => {
          const embedding = await findEmbedding(item.id);
          return { channel, itemId: item.id, embedding };
        })
      );
      // create new embedding worker with listener for results
      const embeddingWorker = new EmbeddingWorker();
      embeddingWorker.onmessage = async (message) => {
        const { type, items } = message.data;
        if (type === "similarity") {
          resolveMatches(items);
          worker.current?.terminate();
        }
      };
      // request embeddings
      embeddingWorker.postMessage({
        type: "similarity",
        items: itemsWithEmbedding.filter((item) => item.embedding),
        sourceEmbedding,
      });
    });
  }

  async function topicSearch(item, topic) {
    // searches other channels in the neighbourhood to find items with matching topic tags
    setSearching(true);
    setMatches([]);
    setSelectedTopic(topic);
    setSearchType("topic");
    const channels = await new SubjectRepository(Channel, {
      perspective,
    }).getAllData();
    let newMatches = [];
    Promise.all(
      channels
        .filter((channel: any) => channel.id !== item.channelId)
        .map(
          (channel: any) =>
            new Promise(async (resolve: any) => {
              const messageMatches = await findTopicMatches(
                channel,
                "Message",
                topic
              );
              const postMatches = await findTopicMatches(
                channel,
                "Post",
                topic
              );
              const taskMatches = await findTopicMatches(
                channel,
                "Task",
                topic
              );
              newMatches.push(
                ...messageMatches,
                ...postMatches,
                ...taskMatches
              );
              resolve();
            })
        )
    ).then(() => {
      setMatches(newMatches.sort((a, b) => b.relevance - a.relevance));
      setSearching(false);
    });
  }

  async function similaritySearch(item) {
    // searches other channels in the neighbourhood to find items with similar vector embeddings
    setSearching(true);
    setSelectedTopic("");
    setMatches([]);
    setSearchType("vector");
    let newMatches = [];
    const sourceEmbedding = await findEmbedding(item.id);
    const channels = await new SubjectRepository(Channel, {
      perspective,
    }).getAllData();
    Promise.all(
      channels
        .filter((channel: any) => channel.id !== item.channelId)
        .map(
          (channel: any) =>
            new Promise(async (resolve: any) => {
              const messageMatches = await findEmbeddingMatches(
                channel,
                "Message",
                sourceEmbedding
              );
              // const postMatches = await findEmbeddingMatches(channel, "Post", sourceEmbedding);
              // const taskMatches = await findEmbeddingMatches(channel, "Task", sourceEmbedding);
              newMatches.push(
                ...messageMatches
                // ...postMatches,
                // ...taskMatches
              );
              resolve();
            })
        )
    ).then(() => {
      const sortedMatches = newMatches.sort(
        (a, b) => b.similarity - a.similarity
      );
      setMatches(sortedMatches);
      setSearching(false);
    });
  }

  function matchText() {
    if (!searchType) return "";
    if (searching) return "Searching for matches...";
    if (matches.length === 0)
      return `No ${searchType} matches ${searchType === "topic" ? `for #${selectedTopic}` : ""}`;
    return `${matches.length} ${searchType} match${matches.length > 1 ? "es" : ""} ${searchType === "topic" ? `for #${selectedTopic}` : ""}`;
  }

  useEffect(() => getAllTopics(perspective, setAllTopics), []);

  // reset matches when channel changes
  useEffect(() => setMatches([]), [source]);

  return (
    <div className={styles.container}>
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
      <j-flex className={styles.wrapper}>
        <div className={styles.channelTimeline}>
          <Timeline
            agent={agent}
            perspective={perspective}
            index={0}
            channelId={source}
            selectedTopic={selectedTopic}
            topicSearch={topicSearch}
            similaritySearch={similaritySearch}
          />
        </div>
        <div id="video-wall" className={styles.videoWall}>
          <WebRTCView
            perspective={perspective}
            source={source}
            agent={agent}
            currentView="@coasys/synergy-demo-view"
            setModalOpen={() => null}
          />
        </div>
        <j-flex direction="column" gap="500" className={styles.matches}>
          <div className={styles.header}>
            <h2>{matchText()}</h2>
          </div>
          {matches.map((match) => (
            <Match perspective={perspective} agent={agent} match={match} />
          ))}
        </j-flex>
      </j-flex>
    </div>
  );
}
