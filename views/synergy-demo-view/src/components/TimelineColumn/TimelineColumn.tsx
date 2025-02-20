import { useEffect, useState, useRef } from "preact/hooks";
import { closeMenu } from "../../utils";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import {
  runProcessingCheck,
  addSynergySignalHandler,
  groupingOptions,
  ProcessingData,
  SynergyGroup,
  SynergyItem,
  SearchType,
  GroupingOption,
  minItemsToProcess,
  numberOfItemsDelay,
  checkIfProcessingInProgress,
  isMe,
} from "@coasys/flux-utils";
import TimelineBlock from "../TimelineBlock";
import styles from "./TimelineColumn.module.scss";
import Avatar from "../Avatar";
import { Channel } from "@coasys/flux-api";

type Props = {
  agent: AgentClient;
  perspective: any;
  channelId: string;
  selectedTopicId: string;
  search: (type: SearchType, id: string) => void;
};

export default function TimelineColumn({ agent, perspective, channelId, selectedTopicId, search }: Props) {
  const [conversations, setConversations] = useState<SynergyGroup[]>([]);
  const [unprocessedItems, setUnprocessedItems] = useState<SynergyItem[]>([]);
  const [processingData, setProcessingData] = useState<ProcessingData | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [zoom, setZoom] = useState<GroupingOption>(groupingOptions[0]);
  const [firstRun, setFirstRun] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const timeout = useRef<any>(null);
  const processing = useRef(true);
  const gettingData = useRef(false);
  const waitingForResponse = useRef(true);

  async function initialise() {
    // add signal listener
    await addSynergySignalHandler(perspective, setProcessingData, waitingForResponse);
    // add listener for new links
    await perspective.addListener("link-added", linkAddedListener);
    // set up recurring check to see if processing in progess (used to recover from disconnected peers)
    checkIfProcessingInProgress(perspective, channelId);
    const intervalId = setInterval(async () => {
      // if no response after 5 seconds, mark waiting false and run processing check
      if (waitingForResponse.current) {
        waitingForResponse.current = false;
        if (!gettingData.current) {
          const newUnproccessedItems = await getUnprocessedItems();
          const enoughUnprocessedItems = newUnproccessedItems.length >= minItemsToProcess + numberOfItemsDelay;
          if (enoughUnprocessedItems) {
            runProcessingCheck(perspective, channelId, newUnproccessedItems, setProcessingData);
          }
        }
      } else if (processingData && !isMe(processingData.author)) {
        // otherwise re-run check (povided processing state is present & we're not the one processing)
        waitingForResponse.current = true;
        checkIfProcessingInProgress(perspective, channelId);
      }
    }, 5000);
    // return cleanup function
    return () => {
      clearInterval(intervalId);
      perspective.removeListener("link-added", linkAddedListener);
    };
  }

  async function getConversations() {
    const channel = new Channel(perspective, channelId);
    return await channel.conversations();
  }

  async function getUnprocessedItems() {
    const channel = new Channel(perspective, channelId);
    return await channel.unprocessedItems();
  }

  async function getData() {
    if (!gettingData.current) {
      gettingData.current = true;
      const [newConversations, newUnproccessedItems] = await Promise.all([getConversations(), getUnprocessedItems()]);
      setConversations(newConversations);
      setUnprocessedItems(newUnproccessedItems);
      setRefreshTrigger((prev) => prev + 1);
      gettingData.current = false;
      // after fetching new data, run processing check if unprocessed items still present
      const enoughUnprocessedItems = newUnproccessedItems.length >= minItemsToProcess + numberOfItemsDelay;
      if (enoughUnprocessedItems && !waitingForResponse.current)
        runProcessingCheck(perspective, channelId, newUnproccessedItems, setProcessingData);
    }
  }

  function linkAddedListener() {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      // if processing, only update unprocessed items
      if (processing.current) setUnprocessedItems(await getUnprocessedItems());
      // otherwise update all data
      else getData();
    }, 2000);
  }

  useEffect(() => {
    const cleanup = initialise();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    processing.current = !!processingData;
    if (!processingData || firstRun) getData();
    if (firstRun) setFirstRun(false);
  }, [processingData]);

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
      </j-flex>
      <div className={styles.timeline}>
        <div className={styles.fades}>
          <div className={styles.fadeTop} />
          <div className={styles.fadeBottom} />
          <div className={styles.line} />
        </div>
        <div id="timeline-0" className={styles.items}>
          {conversations.map((conversation: any) => (
            <TimelineBlock
              key={conversation.baseExpression}
              agent={agent}
              perspective={perspective}
              blockType="conversation"
              data={conversation}
              timelineIndex={0}
              zoom={zoom}
              refreshTrigger={refreshTrigger}
              selectedTopicId={selectedTopicId}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              search={search}
            />
          ))}
          {unprocessedItems.length > 0 && (
            <div style={{ marginLeft: 70 }}>
              <j-text uppercase size="400" weight="800" color="primary-500">
                {unprocessedItems.length} Unprocessed Items
              </j-text>
              {processingData && (
                <j-box mb="500">
                  <j-flex a="center" gap="300">
                    <j-text nomargin>{processingData.items.length} items being processed by</j-text>
                    <Avatar did={processingData.author} showName />
                    {/* @ts-ignore */}
                    <j-spinner size="xs" />
                  </j-flex>
                </j-box>
              )}
              {unprocessedItems.map((item) => (
                <j-flex key={item.baseExpression} gap="400" a="center" className={styles.itemCard}>
                  <j-flex gap="300" direction="column">
                    <j-flex gap="400" a="center">
                      <j-icon name={item.icon} color="ui-400" size="lg" />
                      <j-flex gap="400" a="center" wrap>
                        <Avatar did={item.author} showName />
                      </j-flex>
                      <j-timestamp value={item.timestamp} relative className={styles.timestamp} />
                      {processingData && processingData.items.includes(item.baseExpression) && (
                        <j-badge variant="success">Processing...</j-badge>
                      )}
                    </j-flex>
                    <j-text
                      nomargin
                      dangerouslySetInnerHTML={{ __html: item.text }}
                      className={styles.itemText}
                      color="color-white"
                    />
                  </j-flex>
                </j-flex>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
