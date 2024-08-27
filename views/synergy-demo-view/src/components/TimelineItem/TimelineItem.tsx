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
  topicSearch: (item: any, topic: string) => void;
  similaritySearch: (item: any) => void;
};

export default function TimelineItem({
  agent,
  perspective,
  item,
  index,
  selectedTopic,
  selected,
  setSelectedItemId,
  topicSearch,
  similaritySearch,
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
        const topicNames = results.map((result) => result.name);
        setTopics((prevItems) => {
          if (!isEqual(prevItems, topicNames)) return topicNames;
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
        <j-timestamp value={timestamp} dateStyle="short" />
        <j-timestamp value={timestamp} timeStyle="short" />
      </div>
      <div className={styles.position}>
        <div className={styles.node} />
        <div className={styles.line} />
      </div>
      <j-flex
        direction="column"
        gap="300"
        j="center"
        className={styles.content}
      >
        <j-flex gap="400" a="center" wrap>
          <j-icon name={icon} color="ui-400" />
          <Avatar size="xs" did={author} profile={profile} />
          {selected && (
            <j-flex gap="300" wrap>
              {topics.map((topic) => (
                <button
                  className={`${styles.tag} ${selected && selectedTopic === topic && styles.focus}`}
                  disabled={index > 0}
                  onClick={() => {
                    setSelectedItemId(id);
                    topicSearch(item, topic);
                  }}
                >
                  #{topic}
                </button>
              ))}
              {index === 0 && (
                <button
                  className={`${styles.tag} ${styles.vector}`}
                  onClick={() => {
                    setSelectedItemId(id);
                    similaritySearch(item);
                  }}
                >
                  Vector search
                </button>
              )}
            </j-flex>
          )}
        </j-flex>
        <j-text
          nomargin
          dangerouslySetInnerHTML={{ __html: text }}
          className={styles.text}
          color="color-white"
        />
      </j-flex>
    </div>
  );
}
