import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { transformItem } from "@coasys/flux-utils";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import TimelineItem from "../TimelineItem";
import styles from "./Timeline.module.scss";

type Props = {
  agent: any;
  perspective: any;
  index?: number;
  channelId: string;
  match?: any;
  totalMatches: number;
  selectedTopic?: string;
  scrollToTimeline: (index: number) => void;
  topicSearch: (item: any, topic: string) => void;
  similaritySearch: (item: any) => void;
};

export default function Timeline({
  agent,
  perspective,
  index,
  channelId,
  match,
  totalMatches,
  selectedTopic,
  scrollToTimeline,
  topicSearch,
  similaritySearch,
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(
    match?.itemId || null
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

  function matchText() {
    if (!totalMatches) return "No matches";
    if (index === 0)
      return `${totalMatches} match${totalMatches > 1 ? "es" : ""}`;
    if (totalMatches > index)
      return `${totalMatches - index} more match${totalMatches - index > 1 ? "es" : ""}`;
  }

  // aggregate all items into array and sort by date
  useEffect(() => {
    const newItems = [
      ...messages.map((message) =>
        transformItem(channelId, "Message", message)
      ),
      ...posts.map((post) => transformItem(channelId, "Post", post)),
      ...tasks.map((task) => transformItem(channelId, "Task", task)),
    ].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    // compare previous and new items before updating state to prevent infinite render loop
    setItems((prevItems) => {
      if (!isEqual(prevItems, newItems)) return newItems;
      return prevItems;
    });
  }, [messages, posts, tasks]);

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
  }, [items, selectedItemId]);

  return (
    <div
      id={`timeline-${index}`}
      className={`${styles.wrapper} ${index > 0 && styles.match}`}
    >
      <div className={styles.header}>
        <j-flex gap="400" a="center">
          <h2>{match?.channel.name || "This channel"}</h2>
          {!!match && (
            <>
              {match.similarity ? (
                <p>
                  Similarity score: <b>{match.similarity.toFixed(5)}</b>
                </p>
              ) : (
                <p>
                  Matching topic:{" "}
                  <b>
                    #{selectedTopic} ({match.relevance}% relevance)
                  </b>
                </p>
              )}
            </>
          )}
        </j-flex>
        {window.innerWidth < 1200 || index > 0 ? (
          <j-flex gap="400" a="center">
            {index > (window.innerWidth < 1200 ? 0 : 1) && (
              <j-button
                size="sm"
                circle
                onClick={() => scrollToTimeline(index - 1)}
              >
                <j-icon name="caret-left-fill" />
              </j-button>
            )}
            {index < totalMatches && (
              <j-button
                size="sm"
                circle
                onClick={() => scrollToTimeline(index + 1)}
              >
                <j-icon name="caret-right-fill" />
              </j-button>
            )}
            <j-text
              nomargin
              onClick={() => scrollToTimeline(index + 1)}
              style={{ cursor: "pointer" }}
            >
              {matchText()}
            </j-text>
          </j-flex>
        ) : (
          <j-text nomargin>{matchText()}</j-text>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.fades}>
          <div className={styles.fadeTop} />
          <div className={styles.fadeBottom} />
          <div className={styles.line} />
        </div>
        <div id={`timeline-items-${index}`} className={styles.items}>
          <div className={styles.line} />
          <div style={{ minHeight: "100%" }}>
            {items.map((item) => (
              <TimelineItem
                key={item.id}
                agent={agent}
                perspective={perspective}
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
          <div className={styles.line} />
        </div>
      </div>
    </div>
  );
}
