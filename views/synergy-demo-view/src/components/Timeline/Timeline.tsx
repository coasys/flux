import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import TimelineItem from "../TimelineItem";
import { transformItem } from "./../../utils";
import styles from "./Timeline.module.scss";

type Props = {
  agent: any;
  perspective: any;
  channel: any;
  itemId?: string;
  index?: number;
  topic?: string;
  match?: boolean;
  totalMatches: number;
  scrollToTimeline: (index: number) => void;
  synergize: (item: any, topic: string) => void;
};

export default function Timeline({
  agent,
  perspective,
  channel,
  itemId,
  index,
  topic,
  totalMatches,
  scrollToTimeline,
  synergize,
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(itemId || null);
  const id = channel?.id || channel;

  const { entries: messages } = useSubjects({
    perspective,
    source: id,
    subject: Message,
  });
  const { entries: posts } = useSubjects({
    perspective,
    source: id,
    subject: Post,
  });
  const { entries: tasks } = useSubjects({
    perspective,
    source: id,
    subject: "Task",
  });

  function matchText() {
    if (!totalMatches) return "";
    if (index === 0)
      return `${totalMatches} match${totalMatches > 1 ? "es" : ""}`;
    if (totalMatches > index)
      return `${totalMatches - index} more match${totalMatches - index > 1 ? "es" : ""}`;
  }

  useEffect(() => {
    // aggregate all items into array and sort by date
    const newItems = [
      ...messages.map((message) => transformItem(id, "Message", message)),
      ...posts.map((post) => transformItem(id, "Post", post)),
      ...tasks.map((task) => transformItem(id, "Task", task)),
    ].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    // compare previous and new items before updating state to prevent infinite render loop
    setItems((prevItems) => {
      if (!isEqual(prevItems, newItems)) return newItems;
      return prevItems;
    });
  }, [messages, posts, tasks]);

  useEffect(() => {
    // scroll to matching item
    if (selectedItemId && items.length) {
      const item = document.getElementById(`${index}-${selectedItemId}`);
      const timelineItems = document.getElementById(`timeline-items-${index}`);
      timelineItems.scrollBy({
        top: item.getBoundingClientRect().top - 420,
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
        <h2>{channel?.name || "This channel"}</h2>
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
                agent={agent}
                perspective={perspective}
                item={item}
                index={index}
                topic={topic}
                selected={item.id === selectedItemId}
                setSelectedItemId={setSelectedItemId}
                synergize={synergize}
              />
            ))}
          </div>
          <div className={styles.line} />
        </div>
      </div>
    </div>
  );
}
