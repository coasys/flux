<template>
  <j-flex direction="column">
    <div
      class="channel"
      :class="{
        selected,
        // muted: item.channel.notifications?.mute,
        'drag-over': isDragOver,
        'is-dragging': isDragging,
        moving: moveConversationLoading,
      }"
      :draggable="item.channel.isConversation"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="navigateToChannel"
    >
      <div class="title">
        <j-icon
          v-if="item.channel.isConversation && isChild"
          size="xs"
          name="chat-square-text"
          color="ui-500"
          style="margin: 2px 4px 0 0"
        />
        <j-icon v-if="!item.channel.isConversation" size="xs" name="hash" color="ui-500" />

        <j-text nomargin>{{ item.conversation ? item.conversation.conversationName : item.channel.name }}</j-text>
      </div>

      <div v-if="item.lastActivity" class="last-activity">
        <j-text nomargin size="300">•</j-text>
        <j-text nomargin size="300">
          <j-timestamp :value="item.lastActivity" relative class="timestamp" />
        </j-text>
      </div>

      <button v-if="item.children?.length" class="show-children-button" @click.stop="expanded = !expanded">
        <ChevronDownIcon v-if="expanded" />
        <ChevronRightIcon v-else />
        {{ item.children.length }}
      </button>

      <div class="agents" v-if="agentsInChannel.length || agentsInCall.length">
        <div class="agents-in-channel" v-if="agentsInChannel.length">
          <j-flex v-for="agent in agentsInChannel" :key="agent.did">
            <div :class="['agent', agent.status]">
              <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
            </div>
          </j-flex>
        </div>

        <div class="agents-in-call" v-if="agentsInCall.length">
          <j-flex v-for="agent in agentsInCall" :key="agent.did">
            <div class="agent in-call">
              <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
            </div>
          </j-flex>
          <RecordingIcon />
        </div>
      </div>
    </div>

    <div v-if="expanded && item.children?.length" style="margin-left: var(--j-space-500)">
      <SidebarItem v-for="child in item.children" :key="child.channel.baseExpression" :item="child" is-child />
    </div>
  </j-flex>
</template>

<script setup lang="ts">
import { ChevronDownIcon, ChevronRightIcon, RecordingIcon } from "@/components/icons";
import { ChannelData, useCommunityService } from "@/composables/useCommunityService";
import { useRouteMemoryStore, useUiStore } from "@/stores";
import { computed, defineOptions, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "SidebarItem" });

type Props = { item: ChannelData; isChild?: boolean };
const { item } = defineProps<Props>();

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const routeMemoryStore = useRouteMemoryStore();
const { moveConversation, moveConversationLoading } = useCommunityService();

const expanded = ref(false);
const isDragOver = ref(false);
const isDragging = ref(false);

const selected = computed(() => item.channel.baseExpression === route.params.channelId);
const agentsInChannel = computed(() => aggregateAgents(expanded.value, item, "agentsInChannel") || []);
const agentsInCall = computed(() => aggregateAgents(expanded.value, item, "agentsInCall") || []);

function aggregateAgents(expanded: boolean, item: ChannelData, agentKey: "agentsInChannel" | "agentsInCall") {
  // If collapsed and children exist, aggregate agents from child channels
  if (!expanded && item.children?.length) {
    const childAgents = item.children.flatMap((child) => child[agentKey] || []);
    return [...(item[agentKey] || []), ...childAgents];
  }
  // Otherwise, just return agents from the current channel
  return item[agentKey];
}

function navigateToChannel() {
  // Use the route memory to navigate back to the last opened view in the channel if saved
  const communityId = route.params.communityId as string;
  const channelId = item.channel.baseExpression || "";
  const lastViewId = routeMemoryStore.getLastChannelView(communityId, channelId);
  const defaultViewId = item.channel.isConversation ? "conversation" : "conversations";
  router.push({ name: "view", params: { communityId, channelId, viewId: lastViewId || defaultViewId } });

  // Toggle the community sidebar shut if open (only has effect on mobile)
  uiStore.toggleCommunitySidebar();
}

function expandIfInNestedChannel() {
  // Expand the item when the user navigates to a channel included in its children
  const currentChannelId = route.params.channelId as string;
  const inNestedChannel = item.children?.some((c: any) => c.channel.baseExpression === currentChannelId);
  if (inNestedChannel) expanded.value = true;
}

function handleDragStart(event: DragEvent) {
  if (!item.channel.isConversation) return;

  isDragging.value = true;
  event.dataTransfer!.effectAllowed = "move";
  event.dataTransfer!.setData("application/json", item.channel.baseExpression!);

  // Prevent navigation when dragging starts
  event.stopPropagation();
}

function handleDragEnd() {
  isDragging.value = false;
}

function handleDragOver(event: DragEvent) {
  if (item.channel.isConversation) return;

  event.preventDefault();
  event.dataTransfer!.dropEffect = "move";
  isDragOver.value = true;
}

function handleDragLeave(event: DragEvent) {
  // Only remove drag-over if we're actually leaving the element
  const currentTarget = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;

  if (!currentTarget.contains(relatedTarget)) isDragOver.value = false;
}

async function handleDrop(event: DragEvent) {
  if (item.channel.isConversation) return;

  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;

  try {
    const conversationChannelId = event.dataTransfer!.getData("application/json");
    await moveConversation(conversationChannelId, item.channel.baseExpression!);
  } catch (error) {
    console.error("Error handling drop:", error);
    // Could show a toast notification here
  }
}

watch(() => route.params.channelId, expandIfInNestedChannel, { immediate: true });
</script>

<style lang="scss" scoped>
.channel {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--j-space-300);
  margin: 0 -10px;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &.selected {
    background-color: var(--j-color-primary-100);
  }

  &.muted {
    opacity: 0.6;
  }

  &:hover:not(.is-dragging, .selected) {
    background-color: var(--j-color-ui-100);
  }

  &[draggable="true"] {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &.is-dragging {
      opacity: 0.6;
      transform: rotate(1deg);
    }
  }

  &.drag-over {
    background-color: var(--j-color-primary-200);
    box-shadow: inset 0 0 0 1px var(--j-color-primary-500);
  }

  &.moving {
    opacity: 0.7;
    pointer-events: none;
  }

  // Prevent drag on non-draggable items
  &:not([draggable="true"]) {
    user-select: none;
  }

  .title {
    display: flex;
    align-items: center;
    gap: var(--j-space-200);
    margin-right: var(--j-space-100);
  }

  .last-activity {
    display: flex;
    gap: var(--j-space-200);
    flex-shrink: 0;
    margin-right: var(--j-space-200);
  }

  .show-children-button {
    all: unset;
    cursor: pointer;
    z-index: 2;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--j-color-ui-300);
    font-weight: 600;
    font-size: var(--j-font-size-400);
    margin-right: var(--j-space-200);

    > svg {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
  }

  .notification {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--j-color-primary-500);
    flex-shrink: 0;
  }

  .agents {
    display: flex;
    flex: 1;
    gap: var(--j-space-200);

    .agents-in-channel {
      display: flex;
    }

    .agents-in-call {
      display: flex;
      margin-left: auto;
    }
  }

  .agent {
    height: 20px;
    z-index: 1;
    border-radius: 50%;

    &:not(:first-child) {
      margin-left: -10px;
    }

    &.active {
      box-shadow: 0 0 0 1px var(--j-color-success-300);
    }

    &.asleep {
      box-shadow: 0 0 0 1px var(--j-color-warning-500);
    }

    &.in-call {
      box-shadow: 0 0 0 1px var(--j-color-danger-400);
    }
  }
}
</style>
