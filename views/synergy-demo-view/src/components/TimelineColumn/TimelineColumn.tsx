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
import { Literal } from "@coasys/ad4m";

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
  const [firstRun, setFirstRun] = useState(true);
  const timeout = useRef<any>(null);
  const totalConversationItems = useRef(0);
  const processingRef = useRef(true);
  const gettingDataRef = useRef(false);

  async function getConversationData() {
    const newConversations = await getConversations(perspective, channelId);
    setConversations(newConversations);
  }

  async function getUnprocessedItems() {
    // addapted from getSynergyItems in synergy.tx to exclude items already connected to subgroups
    const result = await perspective.infer(`
      findall([ItemId, Author, Timestamp, Type, Text], (
        % 1. Get channel item
        triple("${channelId}", "ad4m://has_child", ItemId),
      
        % 2. Ensure item is not yet connected to a subgroup (i.e unprocessed)
        findall(SubgroupItem, (
          subject_class("ConversationSubgroup", CS),
          instance(CS, Subgroup),
          triple(Subgroup, "ad4m://has_child", SubgroupItem)
        ), SubgroupItems),
        findall(X, (member(ItemId, SubgroupItems)), []),
      
        % 3. Get timestamp and author
        findall(
          [Timestamp, Author], 
          link(_, "ad4m://has_child", ItemId, Timestamp, Author),
          AllData
        ), 
        sort(AllData, SortedData),
        SortedData = [[Timestamp, Author]|_],
      
        % 4. Check item type and get text
        (
          Type = "Message",
          subject_class("Message", TaskClass),
          instance(MessageClass, ItemId), 
          property_getter(MessageClass, ItemId, "body", Text)
          ;
          Type = "Post",
          subject_class("Post", TaskClass),
          instance(PostClass, ItemId), 
          property_getter(PostClass, ItemId, "title", Text)
          ;
          Type = "Task",
          subject_class("Task", TaskClass),
          instance(TaskClass, ItemId), 
          property_getter(TaskClass, ItemId, "name", Text)
        )
      ), Items).
    `);

    const icons = { Message: "chat", Post: "postcard", Task: "kanban" };
    const formattedItems = (result[0]?.Items || []).map(([itemId, author, timestamp, type, text]) => ({
      itemId,
      author,
      timestamp,
      text: Literal.fromUrl(text).get().data,
      icon: icons[type] ? icons[type] : "question",
    }));

    setUnprocessedItems(formattedItems);
  }

  // useEffect(() => {
  //   getDataNew();
  // }, []);

  // async function runProcessingCheckIfNewItems() {
  //   const channelItems = await getSynergyItems(perspective, channelId);
  //   if (channelItems.length > totalConversationItems.current)
  //     runProcessingCheck(perspective, channelId, channelItems, setProcessing);
  //   totalConversationItems.current = channelItems.length;
  // }

  async function getData() {
    if (!gettingDataRef.current) {
      gettingDataRef.current = true;
      // runProcessingCheckIfNewItems();
      await Promise.all([getConversationData(), getUnprocessedItems()]);
      gettingDataRef.current = false;
    }
  }

  function linkAddedListener() {
    if (!processingRef.current) {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(getData, 2000);
    }
  }

  useEffect(() => {
    // add signal listener
    addSynergySignalHandler(perspective, setProcessing);
    // add listener for new links
    perspective.addListener("link-added", linkAddedListener);

    return () => perspective.removeListener("link-added", linkAddedListener);
  }, []);

  useEffect(() => {
    processingRef.current = !!processing;
    if (!processing || firstRun) getData();
    if (firstRun) setFirstRun(false);
  }, [processing]);

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
          {conversations.map((conversation: any, conversationIndex) => (
            <TimelineBlock
              agent={agent}
              perspective={perspective}
              blockType="conversation"
              data={conversation}
              timelineIndex={0}
              zoom={zoom}
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
                      <j-timestamp value={item.timestamp} relative className={styles.timestamp} />
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
