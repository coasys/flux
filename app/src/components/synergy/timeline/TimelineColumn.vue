<template>
  <div class="wrapper">
    <j-flex a="center" j="between" class="header">
      <j-flex a="center" gap="400">
        <j-text nomargin>Zoom</j-text>
        <j-menu style="height: 42px; z-index: 3">
          <j-menu-group collapsible :title="zoom" id="zoom-menu">
            <j-menu-item
              v-for="option in groupingOptions"
              :key="option"
              :selected="zoom === option"
              @click="
                () => {
                  zoom = option;
                  closeMenu('zoom-menu');
                }
              "
            >
              {{ option }}
            </j-menu-item>
          </j-menu-group>
        </j-menu>
      </j-flex>
    </j-flex>

    <div class="timeline">
      <div class="fades">
        <div class="fade-top" />
        <div class="fade-bottom" />
        <div class="line" />
      </div>

      <div id="timeline-0" class="items">
        <TimelineBlock
          v-for="(conversation, index) in conversations"
          :key="conversation.baseExpression"
          block-type="conversation"
          :last-child="index === conversations.length - 1"
          :data="conversation"
          :timeline-index="0"
          :zoom="zoom"
          :refresh-trigger="refreshTrigger"
          :selected-topic-id="selectedTopicId"
          :selected-item-id="selectedItemId"
          :set-selected-item-id="setSelectedItemId"
          :search="search"
        />

        <div v-if="unprocessedItems.length > 0" style="margin-left: 70px">
          <j-box mb="400">
            <j-flex a="center" j="between">
              <j-text uppercase nomargin size="400" weight="800" color="primary-500">
                {{ unprocessedItems.length }} Unprocessed Items
              </j-text>

              <!-- <j-button v-if="showStartNewConversationButton" variant="primary" size="sm" @click="startNewConversation">
                Start new conversation
              </j-button> -->
            </j-flex>
          </j-box>

          <j-box v-if="processingState" mb="500">
            <j-flex a="center" gap="300">
              <j-text nomargin>{{ processingState.itemIds.length }} items being processed by</j-text>
              <Avatar :did="processingState.author" show-name />
              <j-spinner size="xs" />
            </j-flex>

            <div class="progress">
              <div class="progress-bar" :style="{ width: `calc((100% / 8) * ${processingState.step})` }" />
              <j-text nomargin class="progress-text" color="ui-700" size="400">
                <b>{{ processingSteps[processingState.step - 1] }}</b> ({{ processingState.step }}/8)
              </j-text>
            </div>
          </j-box>

          <j-flex v-for="item in unprocessedItems" :key="item.baseExpression" gap="400" a="center" class="item-card">
            <j-flex gap="300" direction="column">
              <j-flex gap="400" a="center">
                <j-icon :name="item.icon" color="ui-400" size="lg" />
                <j-flex gap="400" a="center" wrap>
                  <Avatar :did="item.author" show-name />
                </j-flex>
                <j-timestamp :value="item.timestamp" relative class="timestamp" />
                <j-badge v-if="processingState?.itemIds?.includes(item.baseExpression)" variant="success">
                  Processing...
                </j-badge>
              </j-flex>

              <j-text nomargin v-html="item.text" class="item-text" color="color-white" />
            </j-flex>
          </j-flex>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from "@/components/synergy/avatar/Avatar.vue";
import TimelineBlock from "@/components/synergy/timeline/TimelineBlock.vue";
import { closeMenu } from "@/components/synergy/utils";
import { useCommunityService } from "@/composables/useCommunityService";
import { useAiStore, useAppStore, useWebrtcStore } from "@/stores";
import { Channel, Conversation } from "@coasys/flux-api";
import { ProcessingState } from "@coasys/flux-types";
import { GroupingOption, groupingOptions, SearchType, SynergyGroup, SynergyItem } from "@coasys/flux-utils";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

interface Props {
  selectedTopicId: string;
  search: (type: SearchType, id: string) => void;
}

defineProps<Props>();

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

const route = useRoute();
const appStore = useAppStore();
const webrtcStore = useWebrtcStore();
const aiStore = useAiStore();

const { signallingService, perspective, isSynced, getPinnedConversations, getRecentConversations } =
  useCommunityService();
const { me } = storeToRefs(appStore);
const { callHealth } = storeToRefs(webrtcStore);
const { defaultLLM } = storeToRefs(aiStore);

const conversations = ref<SynergyGroup[]>([]);
const unprocessedItems = ref<SynergyItem[]>([]);
const processingState = ref<ProcessingState | null>(null);
const selectedItemId = ref("");
const zoom = ref<GroupingOption>(groupingOptions[0]);
const refreshTrigger = ref(0);
const creatingNewConversation = ref(false);
const processing = ref(false);
const gettingData = ref(false);
const linkAddedTimeout = ref<any>(null);
const linkUpdatesQueued = ref<any>(null);

const showStartNewConversationButton = computed(() => {
  if (creatingNewConversation.value || processingState.value) return false;

  const lastConversation = conversations.value[conversations.value.length - 1];
  const processingNames = ["Generating conversation...", "New conversation initialized..."];

  return lastConversation && !processingNames.includes(lastConversation.name);
});

async function getConversations() {
  const channel = new Channel(perspective, route.params.channelId as string);
  return await channel.conversations();
}

async function getUnprocessedItems() {
  const channel = new Channel(perspective, route.params.channelId as string);
  return await channel.unprocessedItems();
}

async function createNewConversation() {
  // Creates a new conversation during the LLM processing phase
  const conversation = new Conversation(perspective, undefined, route.params.channelId as string);
  conversation.conversationName = "Generating conversation...";
  conversation.summary = "Content will appear when processing is complete";
  await conversation.save();
  return conversation;
}

async function startNewConversation() {
  // Starts a new conversation when the user manually clicks the "Create new conversation" button
  creatingNewConversation.value = true;

  const conversation = new Conversation(perspective, undefined, route.params.channelId as string);
  conversation.conversationName = "New conversation initialized...";
  conversation.summary = "Content will appear when the first items have been processed";
  await conversation.save();
}

function checkItemsForResponsibility(items: SynergyItem[], increment = 0): boolean {
  // Find the nth item
  const nthItem = items[increment];
  if (!nthItem) return false;

  // If we're the author, we're responsible
  if (nthItem.author === me.value.did) return true;

  // If not, check if the author has AI enabled and can process items themselves
  const agentState = signallingService.getAgentState(nthItem.author);
  if (agentState?.aiEnabled) return false;

  // If they can't, re-run the check on the next item
  return checkItemsForResponsibility(items, increment + 1);
}

async function checkIfWeShouldStartProcessing(items: SynergyItem[]) {
  // Skip if processing already in progress, not synced, signals are unhealthy, our AI is disabled, or we're in another channel
  if (processing.value || !isSynced.value || callHealth.value !== "healthy" || !defaultLLM) return;

  // Skip if not enough unprocessed items
  const enoughItems = items.length >= MIN_ITEMS_TO_PROCESS + PROCESSING_ITEMS_DELAY;
  if (!enoughItems) return;

  // Skip if we didn't author any of the unprocessed items
  const weAuthoredAtLeastOne = items.some((item) => item.author === me.value.did);
  if (!weAuthoredAtLeastOne) return;

  // Finally, walk through each item to see if we're responsible for processing
  const responsibleForProcessing = checkItemsForResponsibility(items);
  if (responsibleForProcessing) processItems(items);
}

async function processBatch(items: SynergyItem[], conversationId: string) {
  const itemIds = items.map((item) => item.baseExpression);
  signallingService.setProcessingState({
    step: 1,
    channelId: route.params.channelId as string,
    author: me.value.did,
    itemIds,
  });
  const conversation = new Conversation(perspective, conversationId);
  await conversation.processNewExpressions(items, signallingService.setProcessingState);
}

async function processItems(items: SynergyItem[]) {
  processing.value = true;

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
      if (!lastConversation) {
        await processBatch(itemsToProcess, currentConversation.baseExpression);
      } else {
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
    processing.value = false;
    signallingService.setProcessingState(null);
  }
}

async function getData(firstRun?: boolean): Promise<void> {
  if (gettingData.value) return;

  gettingData.value = true;
  const [newConversations, newUnprocessedItems] = await Promise.all([
    getConversations(),
    getUnprocessedItems(),
    // TODO: find better approach (maybe just update all conversations in community service, and have that trigger updates to recent and pinned?)
    getPinnedConversations(),
    getRecentConversations(),
  ]);
  conversations.value = newConversations;
  unprocessedItems.value = newUnprocessedItems;
  if (newConversations.length) creatingNewConversation.value = false;
  gettingData.value = false;
  refreshTrigger.value = refreshTrigger.value + 1;

  // Delay check on first run to allow time for signals to arrive
  setTimeout(() => checkIfWeShouldStartProcessing(newUnprocessedItems), firstRun ? 5000 : 0);
}

// TODO: Remove this if we can achieve the same with subscriptions. Currently indiscriminate about link types.
function handleLinkAdded() {
  // Debounced with LINK_ADDED_TIMEOUT to avoid concurrent data fetches

  // If in cooldown period, just mark that we've seen a new event and exit
  if (linkAddedTimeout.value) {
    linkUpdatesQueued.value = true;
    return null;
  }

  // Otherwise get new data immediately
  getData();
  linkUpdatesQueued.value = false;

  // Set cooldown period with callback that checks for queued updates
  linkAddedTimeout.value = setTimeout(() => {
    linkAddedTimeout.value = null;

    // If new events came in during cooldown, process them now
    if (linkUpdatesQueued.value) {
      getData();
      linkUpdatesQueued.value = false;
    }
  }, LINK_ADDED_TIMEOUT);

  return null;
}

function setSelectedItemId(id: string | null) {
  selectedItemId.value = id || "";
}

onMounted(() => {
  // Wait until appstore & signallingService are available before initializing
  if (signallingService) {
    getData(true);

    // // Listen for new agents state from the signalling service
    // const eventName = `${perspective.uuid}-new-agents-state`;
    // window.addEventListener(eventName, handleNewAgentsState);

    // Listen for link-added events from the perspective
    perspective.addListener("link-added", handleLinkAdded);
  }
});

onUnmounted(() => {
  if (signallingService) {
    // const eventName = `${perspective.uuid}-new-agents-state`;
    // window.removeEventListener(eventName, handleNewAgentsState);
    perspective.removeListener("link-added", handleLinkAdded);
  }

  // Clear timeouts
  if (linkAddedTimeout.value) {
    clearTimeout(linkAddedTimeout.value);
  }
});

watch(
  signallingService.agents.value,
  (newAgents) => {
    // Search for any processing agents in the channel
    const processingAgents = Object.values(newAgents).filter(
      (agent) => agent.processing && agent.processing.channelId === (route.params.channelId as string)
    );

    // Update the progress bar with the latest processing state
    processingState.value = processingAgents[0]?.processing || null;
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
$line-offset: 92px;

.wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 320px);

  .header {
    flex-shrink: 0;
    z-index: 15;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    flex-basis: 100%;
    height: 100%;
    position: relative;

    .fades {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;

      .fade-top {
        position: absolute;
        top: 0;
        height: 100px;
        width: 100%;
        background: linear-gradient(to bottom, var(--app-channel-bg-color), transparent);
        z-index: 10;
      }

      .fade-bottom {
        position: absolute;
        bottom: 0;
        height: 100px;
        width: 100%;
        background: linear-gradient(to top, var(--app-channel-bg-color), transparent);
        z-index: 10;
      }

      .line {
        height: 100%;
        width: 6px;
        margin-left: $line-offset;
        background-color: var(--j-color-primary-200);
      }
    }

    .items {
      height: 100%;
      overflow-y: scroll;
      z-index: 5;
      padding: 130px 20px 130px 60px;

      &::-webkit-scrollbar {
        display: none;
      }

      .line {
        height: 130px;
        width: 6px;
        margin-left: $line-offset;
        background-color: var(--j-color-primary-200);
      }

      .item-card {
        display: flex;
        margin-bottom: 20px;
        width: 100%;
        border: 1px solid var(--j-color-ui-300);
        border-radius: var(--j-border-radius);
        padding: var(--j-space-400);
        background-color: var(--j-color-ui-100);

        .timestamp {
          font-size: 14px;
          color: var(--j-color-ui-400);
        }
      }

      .item-text :deep(p) {
        margin: 0;
      }

      .progress {
        position: relative;
        width: 100%;
        height: 24px;
        margin-top: var(--j-space-400);
        border-radius: 12px;
        background-color: var(--j-color-ui-100);
        box-shadow: 0 0 0 1px var(--j-color-ui-300);

        .progress-bar {
          height: 24px;
          border-radius: 12px;
          background-color: var(--j-color-primary-300);
          transition: width 0.3s ease-in-out;
        }

        .progress-text {
          position: absolute;
          top: 2.5px;
          left: 10px;
        }
      }
    }
  }
}
</style>
