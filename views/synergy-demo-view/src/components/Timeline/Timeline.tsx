import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import TimelineItem from "../TimelineItem";
import { transformItem } from "./../../utils";
import styles from "./Timeline.module.scss";
// import { PerspectiveProxy } from "@coasys/ad4m";

type Props = {
  agent: any;
  perspective: any;
  channelId: string;
  itemId?: string;
  index?: number;
  synergize: (item: any, topic: string) => void;
};

export default function Timeline({
  agent,
  perspective,
  channelId,
  itemId,
  index,
  synergize,
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(itemId || null);

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

  useEffect(() => {
    // aggregate all items into array and sort by date
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

  useEffect(() => {
    // scroll to matching item
    if (itemId && items.length) {
      const element = document.getElementById(`${index}-${itemId}`);
      const container = document.getElementById(`timeline-${index}`);
      container.scrollBy({
        top: element.getBoundingClientRect().top - 320,
        behavior: "smooth",
      });
    }
  }, [items]);

  return (
    <div className={`${styles.wrapper} ${itemId && styles.match}`}>
      <div className={styles.fades}>
        <div className={styles.fadeTop} />
        <div className={styles.fadeBottom} />
        <div className={styles.line} />
      </div>
      <div id={`timeline-${index}`} className={styles.items}>
        <div className={styles.line} />
        {items.map((item) => (
          <TimelineItem
            agent={agent}
            perspective={perspective}
            item={item}
            index={index}
            selected={item.id === selectedItemId}
            setSelected={() =>
              setSelectedItemId(item.id === selectedItemId ? null : item.id)
            }
            synergize={synergize}
            match={!!itemId}
          />
        ))}
        <div className={styles.line} />
      </div>
    </div>
  );
}
