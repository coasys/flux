import { useEffect, useState, useRef } from "preact/hooks";
import { closeMenu, getConversations, groupingOptions, GroupData } from "../../utils";
import {
  runProcessingCheck,
  getSynergyItems,
  addSynergySignalHandler,
  findUnprocessedItems,
  findAllChannelSubgroupIds,
} from "@coasys/flux-utils";
import { Conversation, ConversationSubgroup } from "@coasys/flux-api";
import TimelineBlock from "../TimelineBlock";
import styles from "./TimelineColumn.module.scss";
import Avatar from "../Avatar";

type Props = {
  agent: any;
  perspective: any;
  channelId: string;
  selectedTopicId: string;
  search: (type: "topic" | "vector", id: string) => void;
};

type ConversationData = Conversation & GroupData;

export default function TimelineColumn({ agent, perspective, channelId, selectedTopicId, search }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [unprocessedItems, setUnprocessedItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState<any>(null);
  const [selectedItemId, setSelectedItemId] = useState<any>(null);
  const [zoom, setZoom] = useState(groupingOptions[0]);
  // const [firstRun, setFirstRun] = useState(true);
  // const timeout = useRef<any>(null);
  // const totalConversationItems = useRef(0);
  // const processingRef = useRef(true);
  // const gettingDataRef = useRef(false);

  async function getConversations() {
    const newConversations = (await Conversation.query(perspective, { source: channelId })) as ConversationData[];
    // newConversations.forEach((conversation, conversationIndex) => {
    //   if (match && conversation.baseExpression === match.baseExpression) setMatchIndex(conversationIndex);
    // });
    setConversations(newConversations);
  }

  async function getUnprocessedItems() {
    const channelItems = await getSynergyItems(perspective, channelId);
    const conversations = (await Conversation.query(perspective, {
      source: channelId,
    })) as Conversation[];
    const allSubgroupIds = await findAllChannelSubgroupIds(perspective, conversations);
    const newUnprocessedItems = await findUnprocessedItems(perspective, channelItems, allSubgroupIds);
    setUnprocessedItems(newUnprocessedItems);
  }

  useEffect(() => {
    getConversations();
  }, []);

  // async function runProcessingCheckIfNewItems() {
  //   const channelItems = await getSynergyItems(perspective, channelId);
  //   if (channelItems.length > totalConversationItems.current)
  //     runProcessingCheck(perspective, channelId, channelItems, setProcessing);
  //   totalConversationItems.current = channelItems.length;
  // }

  // async function getData() {
  //   if (!gettingDataRef.current) {
  //     gettingDataRef.current = true;
  //     runProcessingCheckIfNewItems();
  //     const data = await getConversations(perspective, channelId);
  //     setUnprocessedItems(data.unprocessedItems);
  //     setConversations(data.conversations);
  //     gettingDataRef.current = false;
  //   }
  // }

  // function linkAddedListener() {
  //   if (!processingRef.current) {
  //     if (timeout.current) clearTimeout(timeout.current);
  //     timeout.current = setTimeout(getData, 2000);
  //   }
  // }

  // useEffect(() => {
  //   // add signal listener
  //   addSynergySignalHandler(perspective, setProcessing);
  //   // add listener for new links
  //   perspective.addListener("link-added", linkAddedListener);

  //   return () => perspective.removeListener("link-added", linkAddedListener);
  // }, []);

  // useEffect(() => {
  //   processingRef.current = !!processing;
  //   if (!processing || firstRun) getData();
  //   if (firstRun) setFirstRun(false);
  // }, [processing]);

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
              agent={agent}
              perspective={perspective}
              blockType="conversation"
              data={conversation}
              index={0}
              zoom={zoom}
              selectedTopicId={selectedTopicId}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              search={search}
            />
            // <TimelineBlock
            //   agent={agent}
            //   perspective={perspective}
            //   data={conversation}
            //   index={0}
            //   zoom={zoom}
            //   selectedTopicId={selectedTopicId}
            //   selectedItemId={selectedItemId}
            //   setSelectedItemId={setSelectedItemId}
            //   search={search}
            // />
          ))}
          {unprocessedItems.length > 0 && (
            <div style={{ marginLeft: 70 }}>
              <j-text uppercase size="400" weight="800" color="primary-500">
                {unprocessedItems.length} Unprocessed Items
              </j-text>
              {processing && (
                <j-box mb="500">
                  <j-flex a="center" gap="300">
                    <j-text nomargin>{processing.items.length} items being processed by</j-text>
                    <Avatar did={processing.author} showName />
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
                      {processing && processing.items.includes(item.baseExpression) && (
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
