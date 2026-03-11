<template>
  <div class="timeline-column">
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

      <j-flex a="center" gap="300">
        <j-button
          v-if="conversations.length > 0"
          size="sm"
          variant="ghost"
          :loading="exporting"
          @click="exportTranscript"
        >
          <j-icon name="download" slot="start" />
          Export
        </j-button>

        <j-button
          size="sm"
          variant="ghost"
          :loading="exportingFlat"
          @click="exportChannelMessagesFlat"
        >
          <j-icon name="download" slot="start" />
          Export messages
        </j-button>
      </j-flex>
    </j-flex>

    <div class="timeline">
      <div class="fades">
        <div class="fade-top" />
        <div class="fade-bottom" />
        <div class="line" />
      </div>

      <!-- Loading state -->
      <div v-if="loading" style="margin-top: 200px">
        <j-flex direction="column" gap="500" a="center" j="center" class="loading-state">
          <j-spinner />
          <j-text nomargin>Loading timeline...</j-text>
        </j-flex>
      </div>

      <div v-else id="timeline-0" class="items">
        <TimelineBlock
          v-for="(conversation, index) in conversations"
          :key="conversation.id"
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

        <div v-if="unprocessedItems.length > 0" class="unprocessed-items">
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
            <j-box mb="400">
              <j-flex a="center" gap="300">
                <j-text nomargin>{{ processingState.itemIds.length }} items being processed by</j-text>
                <Avatar :did="processingState.author" show-name />
                <j-spinner size="xs" />
              </j-flex>
            </j-box>

            <ProgressBar :steps="llmProcessingSteps" :current-step="processingState.step" />
          </j-box>

          <j-flex v-for="item in unprocessedItems" :key="item.id" gap="400" a="center" class="item-card">
            <j-flex gap="300" direction="column">
              <j-flex gap="400" a="center">
                <j-icon :name="item.icon" color="ui-400" size="lg" />
                <j-flex gap="400" a="center" wrap>
                  <Avatar :did="item.author" show-name />
                </j-flex>
                <j-timestamp :value="item.timestamp" relative class="timestamp" />
                <j-badge v-if="processingState?.itemIds?.includes(item.id)" variant="success"> Processing... </j-badge>
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
import Avatar from '@/components/conversation/avatar/Avatar.vue';
import TimelineBlock from '@/components/conversation/timeline/TimelineBlock.vue';
import ProgressBar from '@/components/progress-bar/ProgressBar.vue';
import { useCommunityService } from '@/composables/useCommunityService';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { llmProcessingSteps, useAiStore, useAppStore } from '@/stores';
import { closeMenu } from '@/utils/helperFunctions';
import { restoreChannelPrefix, stripNeighbourhoodPrefix } from '@/utils/routeUtils';
import { Channel, Conversation } from '@coasys/flux-api';
import { ProcessingState } from '@coasys/flux-types';
import { GroupingOption, groupingOptions, SearchType, SynergyGroup, SynergyItem } from '@coasys/flux-utils';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

interface Props {
  selectedTopicId: string;
  search: (type: SearchType, id: string) => void;
}

defineProps<Props>();

const LINK_ADDED_TIMEOUT = 2000;

const route = useRoute();
const appStore = useAppStore();
const aiStore = useAiStore();

const { aiEnabled } = storeToRefs(aiStore);

const { signallingService, perspective, getRecentConversations, getPinnedConversations, getChannelsWithConversations } =
  useCommunityService();

const channelUrl = restoreChannelPrefix(route.params.channelId as string);

const conversations = ref<SynergyGroup[]>([]);
const unprocessedItems = ref<SynergyItem[]>([]);
const processingState = ref<ProcessingState | null>(null);
const selectedItemId = ref('');
const zoom = ref<GroupingOption>(groupingOptions[0]);
const refreshTrigger = ref(0);
const gettingData = ref(false);
const linkAddedTimeout = ref<any>(null);
const linkUpdatesQueued = ref<any>(null);
const loading = ref(true);
const exporting = ref(false);
const exportingFlat = ref(false);

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '')?.trim() || '';
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  } catch {
    return ts;
  }
}

async function exportChannelMessagesFlat() {
  if (exportingFlat.value || !appStore.ad4mClient) return;
  exportingFlat.value = true;
  try {
    const channel = new Channel(perspective, channelUrl);
    const items = await channel.allItems();
    if (!items || items.length === 0) {
      exportingFlat.value = false;
      return;
    }

    const itemsWithNames = await Promise.all(
      items.map(async (item) => {
        const profile = await getCachedAgentProfile(item.author, appStore.ad4mClient);
        const authorName = profile.givenName || profile.username || item.author?.slice(0, 16) || 'Unknown';
        return { ...item, authorName };
      }),
    );

    const sorted = [...itemsWithNames].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const lines: string[] = [];
    lines.push('# Channel messages');
    lines.push('');

    for (const item of sorted) {
      const text = stripHtml(item.text);
      if (!text) continue;
      const time = formatTimestamp(item.timestamp);
      lines.push(`**${item.authorName}** _(${time})_`);
      lines.push(text);
      lines.push('');
    }

    const fullMarkdown = lines.join('\n');

    try {
      await navigator.clipboard.writeText(fullMarkdown);
    } catch (clipboardError) {
      console.warn('Clipboard write failed:', clipboardError);
    }

    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `channel-messages-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export flat channel messages:', error);
  } finally {
    exportingFlat.value = false;
  }
}

async function exportTranscript() {
  if (exporting.value || conversations.value.length === 0 || !appStore.ad4mClient) return;
  exporting.value = true;
  try {
    // Create Conversation model instances from the timeline data
    const markdowns: string[] = [];
    for (const convData of conversations.value) {
      const conv = new Conversation(perspective, convData.id);
      // Pass unprocessed items to the last (most recent) conversation
      const isLast = convData === conversations.value[conversations.value.length - 1];
      const unprocessed = isLast ? unprocessedItems.value : undefined;
      const md = await conv.exportMarkdown(appStore.ad4mClient, unprocessed);
      markdowns.push(md);
    }

    const fullMarkdown = markdowns.join('\n\n');

    // Copy to clipboard (separate try/catch so download still works on permission error)
    try {
      await navigator.clipboard.writeText(fullMarkdown);
    } catch (clipboardError) {
      console.warn('Clipboard write failed:', clipboardError);
    }

    // Trigger a file download
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export transcript:', error);
  } finally {
    exporting.value = false;
  }
}

async function getConversations() {
  const channel = await Channel.findOne(perspective, { where: { id: channelUrl }, include: { conversations: true } });
  return channel?.conversationsData() ?? [];
}

async function getUnprocessedItems() {
  const channel = new Channel(perspective, channelUrl);
  return await channel.unprocessedItems();
}

async function getData(firstRun?: boolean): Promise<void> {
  if (gettingData.value) return;

  gettingData.value = true;

  try {
    const [newConversations, newUnprocessedItems] = await Promise.all([getConversations(), getUnprocessedItems()]);

    // Update sidebar items if the conversations name has changed
    if (conversations.value[0] && newConversations[0] && conversations.value[0].name !== newConversations[0].name) {
      getPinnedConversations();
      getRecentConversations();
      getChannelsWithConversations();
    }

    // Update state
    conversations.value = newConversations;
    unprocessedItems.value = newUnprocessedItems;
    gettingData.value = false;
    if (firstRun) loading.value = false;

    // Trigger a refresh in child components
    refreshTrigger.value = refreshTrigger.value + 1;

    // If this is not the first run and AI is enabled, check if we should process tasks
    if (firstRun || !aiEnabled.value) return;
    const shouldProcess = await aiStore.checkIfWeShouldProcessTask(newUnprocessedItems, signallingService);
    if (shouldProcess) {
      const channel = new Channel(perspective, channelUrl);
      aiStore.addTasksToProcessingQueue([{ communityId: perspective.sharedUrl!, channel }]);
    }
  } catch (error) {
    console.error('Error fetching conversations or unprocessed items:', error);
    gettingData.value = false;
  }
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
  selectedItemId.value = id || '';
}

onMounted(() => {
  // Wait until appstore & signallingService are available before initializing
  if (signallingService) {
    getData(true);

    // Listen for link-added events from the perspective
    perspective.addListener('link-added', handleLinkAdded);
  }
});

onUnmounted(() => {
  // Remove the link-added listener when the component is unmounted
  if (signallingService) perspective.removeListener('link-added', handleLinkAdded);

  // Clear timeouts
  if (linkAddedTimeout.value) clearTimeout(linkAddedTimeout.value);
});

watch(
  signallingService.agents.value,
  (newAgents) => {
    // Search for any processing agents in the channel
    const processingAgents = Object.values(newAgents).filter(
      (agent) => agent.processing && agent.processing.channelId === channelUrl,
    );

    // Update the progress bar with the latest processing state
    processingState.value = processingAgents[0]?.processing || null;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.timeline-column {
  display: flex;
  flex-direction: column;
  height: 100%;

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
        margin-left: 92px;
        background-color: var(--j-color-primary-200);

        @media screen and (max-width: $breakpoint-mobile) {
          margin-left: 12px;
        }
      }
    }

    .items {
      height: 100%;
      overflow-y: scroll;
      z-index: 5;
      padding: 90px 20px 90px 60px;

      @media screen and (max-width: $breakpoint-mobile) {
        padding: 70px 0;
        margin-left: -20px;
      }

      &::-webkit-scrollbar {
        display: none;
      }

      .unprocessed-items {
        margin-left: 70px;

        @media screen and (max-width: $breakpoint-mobile) {
          margin-left: 56px;
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
      }
    }
  }
}
</style>
