import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import { closeMenu, getConvoData, groupingOptions, findItemState } from "../../utils";
import { processItem } from "@coasys/flux-utils";
import TimelineBlock from "../TimelineBlock";
import styles from "./TimelineColumn.module.scss";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";

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
  const [processingItems, setProcessingItems] = useState<any[]>([]);
  const [unprocessedItems, setUnprocessedItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<any>(null);
  const [zoom, setZoom] = useState(groupingOptions[0]);
  const [usingLLM, setUsingLLM] = useState(false);

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

  async function processItems() {
    setProcessing(true);
    // mark items as processing (or do one at a time? to avoid errors if processing fails)
    for (const item of unprocessedItems) {
      // check if item still needs processing first incase someone has started
      const state = await findItemState(perspective, item);
      if (state !== "unprocessed") continue;
      await processItem(perspective, channelId, item, true);
    }
    setProcessing(false);
  }

  // todo: check if LLM is enabled
  async function checkLLM() {
    const client = await getAd4mClient();
    const modelStatus = await client.ai.getModels();
    setUsingLLM(true);
  }

  useEffect(() => {
    checkLLM();
  }, []);

  useEffect(() => {
    if (channelId) {
      getConvoData(perspective, channelId).then((convoData) => {
        setProcessingItems(convoData.processingItems);
        setUnprocessedItems(convoData.unprocessedItems);
        setData((prevItems) => {
          if (!isEqual(prevItems, convoData.conversations)) return convoData.conversations;
          return prevItems;
        });
      });
    }
  }, [channelId, JSON.stringify(messages), JSON.stringify(posts), JSON.stringify(tasks)]);

  return (
    <div className={styles.wrapper}>
      <j-flex a="center" j="between" className={styles.header}>
        <j-flex a="center" gap="400">
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
        {(processingItems.length > 0 || unprocessedItems.length > 0) && (
          <j-flex a="center" gap="400">
            {processingItems.length > 0 && (
              <j-badge variant="success">
                {processingItems.length} item{processingItems.length > 1 ? "s" : ""} processing...
              </j-badge>
            )}
            {unprocessedItems.length > 0 && (
              <>
                <j-badge variant="warning">
                  {unprocessedItems.length} unprocessed item{unprocessedItems.length > 1 ? "s" : ""}
                </j-badge>
                {usingLLM && (
                  <j-button
                    size="sm"
                    onClick={processItems}
                    loading={processing}
                    disabled={processing}
                  >
                    Process
                  </j-button>
                )}
              </>
            )}
          </j-flex>
        )}
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
