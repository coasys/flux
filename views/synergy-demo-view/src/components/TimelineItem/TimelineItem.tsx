import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Relationship } from "@coasys/flux-api";
import { useAgent } from "@coasys/flux-react-web";
import { findTopics, profileFormatter } from "@coasys/flux-utils";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import Avatar from "../Avatar";
import styles from "./TimelineItem.module.scss";

type Props = {
  agent: any;
  perspective: any;
  item: any;
  index: number;
  selectedTopic: string;
  selected: boolean;
  setSelectedItemId: (id: string) => void;
  synergize: (item: any, topic: string) => void;
};

export default function TimelineItem({
  agent,
  perspective,
  item,
  index,
  selectedTopic,
  selected,
  setSelectedItemId,
  synergize,
}: Props) {
  const { id, timestamp, author, text, icon } = item;
  const [topics, setTopics] = useState<any[]>([]);

  const { profile } = useAgent({
    client: agent,
    did: author,
    //@ts-ignore
    formatter: profileFormatter,
  });

  const { entries: relationships } = useSubjects({
    perspective,
    source: id,
    subject: Relationship,
  });

  useEffect(() => {
    if (relationships.length) {
      findTopics(perspective, relationships).then((results) => {
        setTopics((prevItems) => {
          if (!isEqual(prevItems, results)) return results;
          return prevItems;
        });
      });
    }
  }, [relationships]);

  return (
    <div
      id={`${index}-${item.id}`}
      className={`${styles.wrapper} ${selected && styles.selected} ${index > 0 && styles.match}`}
    >
      <button
        className={styles.button}
        onClick={() => setSelectedItemId(selected ? null : id)}
      />
      <div className={styles.timestamp}>
        <j-timestamp value={timestamp} dateStyle="short" timeStyle="short" />
      </div>
      <div className={styles.position}>
        <div className={styles.node} />
        <div className={styles.line} />
      </div>
      <j-flex
        direction="column"
        gap="500"
        j="center"
        className={styles.content}
      >
        <j-flex gap="400" a="center" wrap>
          <j-icon name={icon} />
          <Avatar size="sm" did={author} profile={profile} />
          <j-flex gap="300" wrap>
            {topics.map((topic) => (
              <button
                className={`${styles.topic} ${selected && selectedTopic === topic && styles.focus}`}
                onClick={() => {
                  setSelectedItemId(id);
                  synergize(item, topic);
                }}
              >
                #{topic}
              </button>
            ))}
          </j-flex>
        </j-flex>
        {selected && (
          <j-text nomargin dangerouslySetInnerHTML={{ __html: text }} />
        )}
      </j-flex>
    </div>
  );
}
