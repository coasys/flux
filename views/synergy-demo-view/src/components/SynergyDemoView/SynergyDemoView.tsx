import { LinkQuery } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import { getAllTopics } from "@coasys/flux-utils";
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
const itemFilterOptions = ["All Types", "Messages", "Posts", "Tasks"];

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [openAIKey, setOpenAIKey] = useState(localStorage?.getItem("openAIKey") || "");
  const [matches, setMatches] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>({});
  const [searchType, setSearchType] = useState("");
  const [searchItem, setSearchItem] = useState<any>({});
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState("Conversations");
  const [itemFilter, setItemFilter] = useState("All Types");
  const [includeChannel, setIncludeChannel] = useState(false);
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
    return (
      channels.find((c) => parentLinks.find((p) => p.data.source === c.id)) || { id: "unlinked" }
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
          if ((!includeChannel && channel.id === source) || !allowedTypes.includes(type))
            return null;
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
      // grab all topic links (unable to filter by topic id as stored as json literal not string literal?)
      const topicLinks = await perspective.get(new LinkQuery({ predicate: "flux://has_tag" }));
      const results = await Promise.all(
        topicLinks.map(async (t) => {
          const { data, author, timestamp } = await perspective.getExpression(t.data.target);
          // filter out other topics
          if (!data.includes(topicId)) return null;
          // get relationship data
          const relationshipProxy = await perspective.getSubjectProxy(
            t.data.source,
            "Relationship"
          );
          const expressionId = await relationshipProxy.expression;
          const channel = await findChannel(expressionId, channels);
          const type = await findEntryType(expressionId);
          // if it doesn't match the search filters return null
          if ((!includeChannel && channel.id === source) || !allowedTypes.includes(type))
            return null;
          return {
            id: expressionId,
            author, // todo: get author & timestamp in sub components (not necissary for conversations & subgroups?)
            timestamp,
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
    if (filter === "Conversations") allowedTypes.push("Conversation");
    else if (filter === "Subgroups") allowedTypes.push("ConversationSubgroup");
    else if (filter === "Items") {
      if (itemFilter === "All Types") allowedTypes.push("Message", "Post", "Task");
      else if (itemFilter === "Messages") allowedTypes.push("Message");
      else if (itemFilter === "Posts") allowedTypes.push("Post");
      else if (itemFilter === "Tasks") allowedTypes.push("Task");
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
    return `${matches.length} ${searchType} match${matches.length > 1 ? "es" : ""} ${searchType === "topic" ? `for #${selectedTopic.name}` : ""}`;
  }

  // get all topic tags on page load
  useEffect(() => {
    getAllTopics(perspective).then((topics: any[]) => setAllTopics(topics));
  }, []);

  // update search results on filter changes
  useEffect(() => {
    if (searchItem.id) search(searchType, searchItem);
  }, [filter, itemFilter, includeChannel]);

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
          <div className={styles.header}>
            <j-flex a="center" gap="400" wrap>
              <j-menu>
                <j-menu-group collapsible title={filter}>
                  {filterOptions.map((option) => (
                    <j-menu-item selected={filter === option} onClick={() => setFilter(option)}>
                      {option}
                    </j-menu-item>
                  ))}
                </j-menu-group>
              </j-menu>
              {filter === "Items" && (
                <j-menu>
                  <j-menu-group collapsible title={itemFilter}>
                    {itemFilterOptions.map((option) => (
                      <j-menu-item
                        selected={filter === option}
                        onClick={() => setItemFilter(option)}
                      >
                        {option}
                      </j-menu-item>
                    ))}
                  </j-menu-group>
                </j-menu>
              )}
              <j-checkbox
                checked={includeChannel}
                onChange={() => setIncludeChannel(!includeChannel)}
              >
                Include Channel
              </j-checkbox>
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
