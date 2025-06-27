import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Channel, Conversation } from "@coasys/flux-api";
import { AgentState, ProcessingState, Profile, SignallingService } from "@coasys/flux-types";
import { GroupingOption, groupingOptions, SearchType, SynergyGroup, SynergyItem } from "@coasys/flux-utils";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { closeMenu } from "../../utils";
import Avatar from "../Avatar";
import TimelineBlock from "../TimelineBlock";
import styles from "./TimelineColumn.module.scss";

type Props = {
  agent: AgentClient;
  perspective: any;
  channelId: string;
  selectedTopicId: string;
  signalsHealthy: boolean;
  signallingService: SignallingService;
  appStore: any;
  aiStore: any;
  search: (type: SearchType, id: string) => void;
  getProfile: (did: string) => Promise<Profile>;
};

const MIN_ITEMS_TO_PROCESS = 5;
const MAX_ITEMS_TO_PROCESS = 10;
const PROCESSING_ITEMS_DELAY = 3;
const LINK_ADDED_TIMEOUT = 2000;

const processingSteps = [
  "Getting conversation",
  "Processing items",
  "LLM Group Detection",
  "LLM Topic Generation",
  "LLM Conversation Updates",
  "Generating New Groupings",
  "Generating Vector Embeddings",
  "Processing complete. Commiting batch!",
];

export default function TimelineColumn({
  agent,
  perspective,
  channelId,
  selectedTopicId,
  signalsHealthy,
  signallingService,
  appStore,
  aiStore,
  search,
  getProfile,
}: Props) {
  const [conversations, setConversations] = useState<SynergyGroup[]>([]);
  const [unprocessedItems, setUnprocessedItems] = useState<SynergyItem[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [zoom, setZoom] = useState<GroupingOption>(groupingOptions[0]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [creatingNewConversation, setCreatingNewConversation] = useState(false);
  const processing = useRef(false);
  const gettingData = useRef(false);
  const linkAddedTimeout = useRef<any>(null);
  const linkUpdatesQueued = useRef<any>(null);

  const showStartNewConversationButton = useMemo(() => {
    if (creatingNewConversation || processingState) return false;

    const lastConversation = conversations[conversations.length - 1];
    const processingNames = ["Generating conversation...", "New conversation initialized..."];

    return lastConversation && !processingNames.includes(lastConversation.name);
  }, [creatingNewConversation, processingState, conversations]);

  async function getConversations() {
    const channel = new Channel(perspective, channelId);
    return await channel.conversations();
  }

  async function getUnprocessedItems() {
    const channel = new Channel(perspective, channelId);
    return await channel.unprocessedItems();
  }

  async function createNewConversation() {
    // Creates a new conversation during the LLM processing phase
    const conversation = new Conversation(perspective, undefined, channelId);
    conversation.conversationName = "Generating conversation...";
    conversation.summary = "Content will appear when processing is complete";
    await conversation.save();
    return conversation;
  }

  async function startNewConversation() {
    // Starts a new conversation when the user manually clicks the "Create new conversation" button
    setCreatingNewConversation(true);

    const conversation = new Conversation(perspective, undefined, channelId);
    conversation.conversationName = "New conversation initialized...";
    conversation.summary = "Content will appear when the first items have been processed";
    await conversation.save();
  }

  function checkItemsForResponsibility(items: SynergyItem[], increment = 0): boolean {
    // Find the nth item
    const nthItem = items[increment];
    if (!nthItem) return false;

    // If we're the author, we're responsible
    if (nthItem.author === appStore.me.did) return true;

    // If not, check if the author has AI enabled and can process items themselves
    const agentState = signallingService.getAgentState(nthItem.author);
    if (agentState?.aiEnabled) return false;

    // If they can't, re-run the check on the next item
    return checkItemsForResponsibility(items, increment + 1);
  }

  async function checkIfWeShouldStartProcessing(items: SynergyItem[]) {
    // Skip if processing already in progress, signals are unhealthy, our AI is disabled, or we're in another channel
    if (processing.current || !signalsHealthy || !aiStore.defaultLLM) return;

    // Skip if not enough unprocessed items
    const enoughItems = items.length >= MIN_ITEMS_TO_PROCESS + PROCESSING_ITEMS_DELAY;
    if (!enoughItems) return;

    // Skip if we didn't author any of the unprocessed items
    const weAuthoredAtLeastOne = items.some((item) => item.author === appStore.me.did);
    if (!weAuthoredAtLeastOne) return;

    // Finally, walk through each item to see if we're responsible for processing
    const responsibleForProcessing = checkItemsForResponsibility(items);
    if (responsibleForProcessing) processItems(items);
  }

  async function processBatch(items: SynergyItem[], conversationId: string) {
    const itemIds = items.map((item) => item.baseExpression);
    signallingService.setProcessingState({ step: 1, channelId, author: appStore.me.did, itemIds });
    const conversation = new Conversation(perspective, conversationId);
    await conversation.processNewExpressions(items, signallingService.setProcessingState);
  }

  async function processItems(items: SynergyItem[]) {
    processing.current = true;

    console.log("🤖 LLM processing started");

    try {
      const numberOfItemsToProcess = Math.min(MAX_ITEMS_TO_PROCESS, items.length - PROCESSING_ITEMS_DELAY);
      const itemsToProcess = items.slice(0, numberOfItemsToProcess);
      const currentConversations = await getConversations();
      const currentConversation = currentConversations[currentConversations.length - 1];
      const lastConversation = currentConversations[currentConversations.length - 2];

      if (!currentConversation) {
        // If no conversation found, create a new one and process all items into the new conversation
        const conversation = await createNewConversation();
        await processBatch(itemsToProcess, conversation.baseExpression);
      } else {
        // If current conversation exists but no last conversation, put all items in the current conversation
        if (!lastConversation) await processBatch(itemsToProcess, currentConversation.baseExpression);
        else {
          // If multiple conversations found, split items before and after current conversation based on their timestamps
          const [previousBatch, newBatch] = itemsToProcess.reduce(
            ([prev, next], item) =>
              item.timestamp < currentConversation.timestamp ? [[...prev, item], next] : [prev, [...next, item]],
            [[], []] as [SynergyItem[], SynergyItem[]]
          );

          if (previousBatch.length) await processBatch(previousBatch, lastConversation.baseExpression);
          if (newBatch.length) await processBatch(newBatch, currentConversation.baseExpression);
        }
      }
    } catch (e) {
      console.log("Error processing items into conversation:", e);
    } finally {
      processing.current = false;
      signallingService.setProcessingState(null);
    }
  }

  async function getData(firstRun?: boolean): Promise<void> {
    if (gettingData.current) return;

    gettingData.current = true;
    const [newConversations, newUnproccessedItems] = await Promise.all([getConversations(), getUnprocessedItems()]);
    setConversations(newConversations);
    setUnprocessedItems(newUnproccessedItems);
    if (newConversations.length) setCreatingNewConversation(false);
    gettingData.current = false;
    setRefreshTrigger((prev) => prev + 1);

    // Delay check on first run to allow time for signals to arrive
    setTimeout(() => checkIfWeShouldStartProcessing(newUnproccessedItems), firstRun ? 5000 : 0);
  }

  // TODO: Remove this if we can achieve the same with subscriptions. Currently indiscriminate about link types.
  function handleLinkAdded() {
    // Debounced with LINK_ADDED_TIMEOUT to avoid concurrent data fetches

    // If in cooldown period, just mark that we've seen a new event and exit
    if (linkAddedTimeout.current) {
      linkUpdatesQueued.current = true;
      return;
    }

    // Otherwise get new data immediately
    getData();
    linkUpdatesQueued.current = false;

    // Set cooldown period with callback that checks for queued updates
    linkAddedTimeout.current = setTimeout(() => {
      linkAddedTimeout.current = null;

      // If new events came in during cooldown, process them now
      if (linkUpdatesQueued.current) {
        getData();
        linkUpdatesQueued.current = false;
      }
    }, LINK_ADDED_TIMEOUT);
  }

  function handleNewAgentsState(event: CustomEvent) {
    // Search for any processing agents in the channel
    const newAgentsState = event.detail as Record<string, AgentState>;
    const processingAgents = Object.values(newAgentsState).filter(
      (agent) => agent.processing && agent.processing.channelId === channelId
    );

    // Update the progress bar with the latest processing state
    setProcessingState(processingAgents[0]?.processing || null);
  }

  useEffect(() => {
    // Wait until appstore & signallingService are available before initializing
    if (appStore && signallingService) {
      getData(true);

      // Listen for new agents state from the signalling service
      const eventName = `${perspective.uuid}-new-agents-state`;
      window.addEventListener(eventName, handleNewAgentsState);

      // Listen for link-added events from the perspective
      perspective.addListener("link-added", handleLinkAdded);

      return () => {
        window.removeEventListener(eventName, handleNewAgentsState);
        perspective.removeListener("link-added", handleLinkAdded);
      };
    }
  }, [appStore, signallingService]);

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
          {conversations.map((conversation: SynergyGroup, index) => (
            <TimelineBlock
              key={conversation.baseExpression}
              agent={agent}
              perspective={perspective}
              blockType="conversation"
              lastChild={index === conversations.length - 1}
              data={conversation}
              timelineIndex={0}
              zoom={zoom}
              refreshTrigger={refreshTrigger}
              selectedTopicId={selectedTopicId}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              search={search}
              getProfile={getProfile}
            />
          ))}
          {unprocessedItems.length > 0 && (
            <div style={{ marginLeft: 70 }}>
              <j-box mb="400">
                <j-flex a="center" j="between">
                  <j-text uppercase nomargin size="400" weight="800" color="primary-500">
                    {unprocessedItems.length} Unprocessed Items
                  </j-text>

                  {showStartNewConversationButton && (
                    <j-button variant="primary" size="sm" onClick={startNewConversation}>
                      Start new conversation
                    </j-button>
                  )}
                </j-flex>
              </j-box>

              {processingState && (
                <j-box mb="500">
                  <j-flex a="center" gap="300">
                    <j-text nomargin>{processingState.itemIds.length} items being processed by</j-text>
                    <Avatar did={processingState.author} showName getProfile={getProfile} />
                    {/* @ts-ignore */}
                    <j-spinner size="xs" />
                  </j-flex>

                  <div className={styles.progress}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `calc((100% / 8) * ${processingState.step})` }}
                    />
                    <j-text nomargin className={styles.progressText} color="ui-700" size="400">
                      <b>{processingSteps[processingState.step - 1]}</b> ({processingState.step}/8)
                    </j-text>
                  </div>
                </j-box>
              )}
              {unprocessedItems.map((item) => (
                <j-flex key={item.baseExpression} gap="400" a="center" className={styles.itemCard}>
                  <j-flex gap="300" direction="column">
                    <j-flex gap="400" a="center">
                      <j-icon name={item.icon} color="ui-400" size="lg" />
                      <j-flex gap="400" a="center" wrap>
                        <Avatar did={item.author} showName getProfile={getProfile} />
                      </j-flex>
                      <j-timestamp value={item.timestamp} relative className={styles.timestamp} />
                      {processingState?.itemIds?.includes(item.baseExpression) && (
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
