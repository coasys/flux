<template>
  <j-flex direction="column">
    <div class="channel" :class="{ selected: selected, muted: item.channel.notifications?.mute }">
      <j-flex slot="start" gap="400" a="center">
        <j-flex gap="200" a="center" @click="navigateToChannel" style="cursor: pointer">
          <j-icon size="xs" :name="item.channel.isConversation ? 'flower2' : 'hash'" color="ui-500" />
          <j-text nomargin>{{ item.conversation ? item.conversation.conversationName : item.channel.name }}</j-text>

          <template v-if="item.lastActivity">
            <j-text nomargin size="300">•</j-text>
            <j-text nomargin size="300">
              <j-timestamp :value="item.lastActivity" relative class="timestamp" />
            </j-text>
          </template>
        </j-flex>

        <button v-if="item.children?.length" class="show-children-button" @click="expanded = !expanded">
          <ChevronDown v-if="expanded" />
          <ChevronRight v-else />
          {{ item.children.length }}
        </button>

        <div class="notification" v-if="item.channel.hasNewMessages" />

        <template v-if="agentsInChannel.length">
          <j-flex v-for="agent in agentsInChannel" :key="agent.did">
            <div :class="['agent', agent.status]">
              <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
            </div>
          </j-flex>
        </template>
      </j-flex>

      <j-flex v-if="agentsInCall.length" class="active-agents in-call" slot="end">
        <template v-for="agent in agentsInCall" :key="agent.did">
          <div class="agent in-call">
            <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
          </div>
        </template>

        <RecordingIcon />
      </j-flex>
    </div>

    <div v-if="expanded && item.children?.length" style="margin-left: var(--j-space-500)">
      <SidebarItem v-for="child in item.children" :key="child.channel.baseExpression" :item="child" />
    </div>
  </j-flex>
</template>

<script setup lang="ts">
import ChevronDown from "@/components/icons/ChevronDown.vue";
import ChevronRight from "@/components/icons/ChevronRight.vue";
import RecordingIcon from "@/components/recording-icon/RecordingIcon.vue";
import { useRouteMemoryStore } from "@/stores";
import { computed, defineOptions, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "SidebarItem" });

type Props = { item: any };
const { item } = defineProps<Props>();

const route = useRoute();
const router = useRouter();
const routeMemoryStore = useRouteMemoryStore();

const expanded = ref(false);
const selected = computed(() => item.channel.baseExpression === route.params.channelId);
const agentsInChannel = computed(() => aggregateAgents(expanded.value, item, "agentsInChannel"));
const agentsInCall = computed(() => aggregateAgents(expanded.value, item, "agentsInCall"));

function aggregateAgents(expanded: boolean, item: any, agentKey: string) {
  // If collapsed and children exist, aggregate agents from child channels
  if (!expanded && item.children?.length) {
    const childAgents = item.children.flatMap((child: any) => child[agentKey] || []);
    return [...item[agentKey], ...childAgents];
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
}

function expandIfInNestedChannel() {
  // Expand the item when the user navigates to a channel included in its children
  const currentChannelId = route.params.channelId as string;
  const inNestedChannel = item.children?.some((c: any) => c.channel.baseExpression === currentChannelId);
  if (inNestedChannel) expanded.value = true;
}

watch(() => route.params.channelId, expandIfInNestedChannel, { immediate: true });
</script>

<style lang="scss" scoped>
.channel {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin: 0 -12px;
  padding: 10px;
  border-radius: 6px;

  &.selected {
    background-color: var(--j-color-primary-100);
  }

  &.muted {
    opacity: 0.6;
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
