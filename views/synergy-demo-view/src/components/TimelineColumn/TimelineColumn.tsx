import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import { closeMenu, getConvoData, groupingOptions } from "../../utils";
import TimelineBlock from "../TimelineBlock";
import styles from "./TimelineColumn.module.scss";

type Props = {
  agent: any;
  perspective: any;
  channelId: string;
  selectedTopicId: string;
  search: (type: "topic" | "vector", id: string) => void;
};

export default function TimelineColumn({
  agent,
  perspective,
  channelId,
  selectedTopicId,
  search,
}: Props) {
  const [data, setData] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(null);
  const [zoom, setZoom] = useState(groupingOptions[0]);

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
    if (channelId) {
      getConvoData(perspective, channelId).then((conversationData) => {
        setData((prevItems) => {
          if (!isEqual(prevItems, conversationData)) return conversationData;
          return prevItems;
        });
      });
    }
  }, [channelId, JSON.stringify(messages), JSON.stringify(posts), JSON.stringify(tasks)]);

  return (
    <div className={styles.wrapper}>
      <j-flex a="center" gap="400" className={styles.header}>
        <j-text nomargin>Zoom</j-text>
        <j-menu style={{ height: 42, zIndex: 3 }}>
          <j-menu-group collapsible title={zoom} id="zoom-menu">
            {groupingOptions.map((option) => (
              <j-menu-item
                selected={zoom === option}
                onClick={() => {
                  setZoom(option);
                  closeMenu("zoom-menu");
                }}
              >
                {option}
              </j-menu-item>
            ))}
          </j-menu-group>
        </j-menu>
      </j-flex>
      <div className={styles.timeline}>
        <div className={styles.fades}>
          <div className={styles.fadeTop} />
          <div className={styles.fadeBottom} />
          <div className={styles.line} />
        </div>
        <div id="timeline-0" className={styles.items}>
          {data.map((conversation: any) => (
            <TimelineBlock
              agent={agent}
              perspective={perspective}
              data={conversation}
              index={0}
              zoom={zoom}
              selectedTopicId={selectedTopicId}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              search={search}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
