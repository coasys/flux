import { useSubjects } from "@coasys/ad4m-react-hooks";
import { SemanticRelationship } from "@coasys/flux-api";
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
  selectedTopic?: any;
  selected: boolean;
  setSelectedItemId: (id: string) => void;
  search: (type: "topic" | "vector", id: string) => void;
};

export default function TimelineItem({
  agent,
  perspective,
  item,
  index,
  selectedTopic,
  selected,
  setSelectedItemId,
  search,
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
    subject: SemanticRelationship,
  });

  useEffect(() => {
    if (relationships.length) {
      findTopics(perspective, relationships).then((newTopics) => {
        setTopics((prevItems) => {
          if (!isEqual(prevItems, newTopics)) return newTopics;
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
                  className={`${styles.tag} ${selected && selectedTopic.id === topic.id && styles.focus}`}
                  onClick={() => search("topic", topic)}
                >
                  #{topic.name}
                </button>
              ))}
              <button
                className={`${styles.tag} ${styles.vector}`}
                onClick={() => search("vector", item)}
              >
                Vector search
              </button>
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
