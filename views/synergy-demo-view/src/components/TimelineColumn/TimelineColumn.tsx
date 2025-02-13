import { useEffect, useState, useRef } from "preact/hooks";
import { closeMenu, getConversations } from "../../utils";
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
} from "@coasys/flux-utils";
import TimelineBlock from "../TimelineBlock";
import styles from "./TimelineColumn.module.scss";
import Avatar from "../Avatar";
import { Literal } from "@coasys/ad4m";

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
  const totalItems = useRef(0);
  const processing = useRef(true);
  const gettingData = useRef(false);

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
          subject_class("Message", MessageClass),
          instance(MessageClass, ItemId), 
          property_getter(MessageClass, ItemId, "body", Text)
          ;
          Type = "Post",
          subject_class("Post", PostClass),
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
      baseExpression: itemId,
      author,
      timestamp: new Date(timestamp).toISOString(),
      text: Literal.fromUrl(text).get().data,
      icon: icons[type] ? icons[type] : "question",
    }));

    return formattedItems;
  }

  async function getTotalItemCount() {
    const result = await perspective.infer(`
      findall(Count, (
        findall(Item, (
          % 1. Get items linked to channel
          triple("${channelId}", "ad4m://has_child", Item),
          
          % 2. Check item is of valid type
          (
            subject_class("Message", MC),
            instance(MC, Item)
            ;
            subject_class("Post", PC),
            instance(PC, Item)
            ;
            subject_class("Task", TC),
            instance(TC, Item)
          )
        ), Items),
        
        % 3. Get length of valid items
        length(Items, Count)
      ), [TotalCount]).
    `);

    return result[0]?.TotalCount || 0;
  }

  async function getData() {
    if (!gettingData.current) {
      gettingData.current = true;
      const [newConversations, newUnproccessedItems] = await Promise.all([
        getConversations(perspective, channelId),
        getUnprocessedItems(),
      ]);
      setConversations(newConversations);
      setUnprocessedItems(newUnproccessedItems);
      setRefreshTrigger((prev) => prev + 1);
      gettingData.current = false;
      // after fetching new data, run processing check if new items have been added
      const newTotalItems = await getTotalItemCount();
      if (newTotalItems > totalItems.current)
        runProcessingCheck(perspective, channelId, newUnproccessedItems, setProcessingData);
      totalItems.current = newTotalItems;
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
    // add signal listener
    addSynergySignalHandler(perspective, setProcessingData);
    // add listener for new links
    perspective.addListener("link-added", linkAddedListener);

    return () => perspective.removeListener("link-added", linkAddedListener);
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
