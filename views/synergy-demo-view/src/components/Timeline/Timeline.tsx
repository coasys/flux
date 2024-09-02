import { useSubjects } from "@coasys/ad4m-react-hooks";
import {
  Conversation,
  ConversationSubgroup,
  Message,
  Post,
  SubjectRepository,
} from "@coasys/flux-api";
import {
  findRelationships,
  findTopics,
  getSubgroupItems,
} from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";
import TimelineItem from "../TimelineItem";
import styles from "./Timeline.module.scss";

type Props = {
  agent: any;
  perspective: any;
  index?: number;
  channelId: string;
  match?: any;
  selectedTopic?: string;
  topicSearch: (channelId: string, topic: string) => void;
  similaritySearch: (item: any) => void;
};

export default function Timeline({
  agent,
  perspective,
  index,
  channelId,
  match,
  selectedTopic,
  topicSearch,
  similaritySearch,
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(
    match?.itemId || null
  );
  const [showSummary, setShowSummary] = useState<{ [key: string]: boolean }>(
    {}
  );

  const { entries: messages } = useSubjects({
    perspective,
    source: channelId,
    subject: Message,
  });
  const { entries: posts } = useSubjects({
    perspective,
    source: channelId,
    subject: Post,
  });
  const { entries: tasks } = useSubjects({
    perspective,
    source: channelId,
    subject: "Task",
  });

  function toggleSummary(id: string) {
    setShowSummary((prevState) => ({ ...prevState, [id]: !prevState[id] }));
  }

  async function getConvoData() {
    // gather up conversation data
    const conversationRepo = await new SubjectRepository(Conversation, {
      perspective,
      source: channelId,
    });
    const conversations = (await conversationRepo.getAllData()) as any;
    const conversationsWithData = await Promise.all(
      conversations.map(async (conversation) => {
        const subgroupRepo = await new SubjectRepository(ConversationSubgroup, {
          perspective,
          source: conversation.id,
        });
        const subgroups = (await subgroupRepo.getAllData()) as any;
        const subgroupsWithData = await Promise.all(
          subgroups.map(async (subgroup) => {
            const items = await getSubgroupItems(perspective, subgroup.id);
            subgroup.items = items;
            const subgroupRelationships = await findRelationships(
              perspective,
              subgroup.id
            );
            subgroup.topics = await findTopics(
              perspective,
              subgroupRelationships
            );
            return subgroup;
          })
        );
        conversation.subgroups = subgroupsWithData;
        const conversationRelationships = await findRelationships(
          perspective,
          conversation.id
        );
        conversation.topics = await findTopics(
          perspective,
          conversationRelationships
        );
        return conversation;
      })
    );
    setConversations(conversationsWithData);
  }

  // todo: grab data when new items appear without triggering render loop
  useEffect(() => {
    if (channelId) getConvoData();
  }, [channelId]); // , messages, posts, tasks

  // scroll to matching item
  useEffect(() => {
    if (selectedItemId && items.length) {
      const item = document.getElementById(`${index}-${selectedItemId}`);
      const timelineItems = document.getElementById(`timeline-items-${index}`);
      timelineItems.scrollBy({
        top: item?.getBoundingClientRect().top - 420,
        behavior: "smooth",
      });
    }
  }, [conversations, selectedItemId]);

  return (
    <div
      id={`timeline-${index}`}
      className={`${styles.wrapper} ${index > 0 && styles.match}`}
    >
      <div className={styles.content}>
        <div className={styles.fades}>
          <div className={styles.fadeTop} />
          <div className={styles.fadeBottom} />
          <div className={styles.line} />
        </div>
        <div id={`timeline-items-${index}`} className={styles.items}>
          <div className={styles.line} />
          <div style={{ minHeight: "100%" }}>
            {conversations.map((conversation: any) => (
              <div className={styles.conversation}>
                <j-flex a="center" gap="400">
                  <h1>{conversation.conversationName}</h1>
                  <j-button
                    size="xs"
                    circle
                    onClick={() => toggleSummary(conversation.id)}
                  >
                    <j-icon name="info" />
                  </j-button>
                </j-flex>
                {showSummary[conversation.id] && (
                  <div>
                    <p>{conversation.summary}</p>
                    <j-flex gap="300" wrap>
                      {conversation.topics.map((topic) => (
                        <button
                          className={`${styles.tag} ${selectedTopic === topic && styles.focus}`}
                          onClick={() => {
                            setSelectedItemId(conversation.id);
                            topicSearch(channelId, topic.name);
                          }}
                        >
                          #{topic.name}
                        </button>
                      ))}
                      <button
                        className={`${styles.tag} ${styles.vector}`}
                        onClick={() => {
                          setSelectedItemId(conversation.id);
                          similaritySearch(conversation.id);
                        }}
                      >
                        Vector search
                      </button>
                    </j-flex>
                  </div>
                )}
                {conversation.subgroups.map((subgroup) => (
                  <div className={styles.subgroup}>
                    <j-flex a="center" gap="400">
                      <h2>{subgroup.subgroupName}</h2>
                      <j-button
                        size="xs"
                        circle
                        onClick={() => toggleSummary(subgroup.id)}
                      >
                        <j-icon name="info" />
                      </j-button>
                    </j-flex>
                    {showSummary[subgroup.id] && (
                      <div>
                        <p>{subgroup.summary}</p>
                        <j-flex gap="300" wrap>
                          {subgroup.topics.map((topic) => (
                            <button
                              className={`${styles.tag} ${selectedTopic === topic && styles.focus}`}
                              onClick={() => {
                                setSelectedItemId(subgroup.id);
                                topicSearch(channelId, topic.name); // test
                              }}
                            >
                              #{topic.name}
                            </button>
                          ))}
                          <button
                            className={`${styles.tag} ${styles.vector}`}
                            onClick={() => {
                              setSelectedItemId(subgroup.id);
                              similaritySearch(subgroup.id); // test
                            }}
                          >
                            Vector search
                          </button>
                        </j-flex>
                      </div>
                    )}
                    {subgroup.items.map((item) => (
                      <TimelineItem
                        key={item.id}
                        agent={agent}
                        perspective={perspective}
                        channelId={channelId}
                        item={item}
                        index={index}
                        selectedTopic={selectedTopic}
                        selected={item.id === selectedItemId}
                        setSelectedItemId={setSelectedItemId}
                        topicSearch={topicSearch}
                        similaritySearch={similaritySearch}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.line} />
        </div>
      </div>
    </div>
  );
}
