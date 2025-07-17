<template>
  <j-flex direction="column">
    <div
      class="channel"
      :class="{
        selected: channel.baseExpression === route.params.channelId,
        muted: channel.notifications?.mute,
      }"
    >
      <j-flex slot="start" gap="400" a="center">
        <j-flex gap="200" @click="navigateToChannel" style="cursor: pointer">
          <j-icon size="xs" :name="channel.isConversation ? 'flower2' : 'hash'" color="ui-500" />
          <j-text nomargin>{{ channel.conversation ? channel.conversation.conversationName : channel.name }}</j-text>
        </j-flex>

        <button v-if="channel.children?.length" class="show-children-button" @click="expanded = !expanded">
          <ChevronDown v-if="expanded" />
          <ChevronRight v-else />
          {{ channel.children.length }}
        </button>

        <div class="notification" v-if="channel.hasNewMessages" />

        <j-flex>
          <template v-for="agent in agentsInChannel" :key="agent.did">
            <div :class="['agent', agent.status]">
              <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
            </div>
          </template>
        </j-flex>
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

    <div v-if="expanded && channel.children?.length" style="margin-left: var(--j-space-500)">
      <ChannelListItem
        v-for="conversationChannel in channel.children"
        :key="conversationChannel.baseExpression"
        :channel="conversationChannel"
      />
    </div>
  </j-flex>

  <!-- <j-menu slot="content" v-if="isChannelCreator">
    <j-menu-item @click="() => (modalStore.showEditChannel = true)">
      <j-icon size="xs" slot="start" name="pencil" />
      Edit Channel
    </j-menu-item>

    <j-menu-item @click="deleteChannel">
      <j-icon size="xs" slot="start" name="trash" />
      Delete Channel
    </j-menu-item>
  </j-menu> -->
</template>

<script setup lang="ts">
import ChevronDown from "@/components/icons/ChevronDown.vue";
import ChevronRight from "@/components/icons/ChevronRight.vue";
import RecordingIcon from "@/components/recording-icon/RecordingIcon.vue";
import { ChannelData, useCommunityService } from "@/composables/useCommunityService";
import { useAppStore, useModalStore, useRouteMemoryStore, useUiStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { AgentState, Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, defineOptions, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

type Props = {
  channel: ChannelData;
};
type AgentData = Profile & AgentState;

defineOptions({ name: "ChannelListItem" });
const { channel } = defineProps<Props>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();
const uiStore = useUiStore();
const routeMemoryStore = useRouteMemoryStore();
const { me } = storeToRefs(appStore);
const { signallingService } = useCommunityService();
const { agents } = signallingService;

const activeAgents = ref<AgentData[]>([]);
const expanded = ref(false);

const isChannelCreator = computed(() => channel.author === me.value.did);
const agentsInCall = computed(() =>
  activeAgents.value.filter((agent) => {
    const inCall = agent.callRoute.channelId === channel.baseExpression;
    const inNestedCall = channel.children?.some((child) => child.baseExpression === agent.callRoute.channelId);

    return agent.inCall && expanded.value ? inCall : inCall || inNestedCall;
  })
);
const agentsInChannel = computed(() =>
  activeAgents.value.filter((agent) => {
    const inChannel = agent.currentRoute.channelId === channel.baseExpression;
    const inNestedChannel = channel.children?.some((child) => child.baseExpression === agent.currentRoute.channelId);
    // const inChannelCall = agent.callRoute.channelId === channel.baseExpression;

    return expanded.value ? inChannel : inChannel || inNestedChannel; // && !inChannelCall
  })
);

async function findActiveAgents() {
  if (!agents.value) return [];

  // Include all agents with the channel ID (or nested conversation channel ID) in their currenRoute or their callRoute
  const agentsInChannelMap = Object.entries(agents.value).filter(([_, agent]) => {
    if (["offline", "invisible"].includes(agent.status)) return false;

    const inChannel = agent.currentRoute?.channelId === channel.baseExpression;
    const inCall = agent.inCall && agent.callRoute.channelId === channel.baseExpression;

    // If the channel is expanded or has no children, just check the the channel
    if (expanded.value || !channel.children?.length) return inChannel || inCall;

    // Otherwise, check the nested conversation channels too
    const inChildChannel = channel.children.some((child) => child.baseExpression === agent.currentRoute?.channelId);
    const inChildCall = channel.children.some((child) => child.baseExpression === agent.callRoute?.channelId);
    return inChannel || inCall || inChildChannel || inChildCall;
  });

  // Get each agents profile
  activeAgents.value = await Promise.all(
    agentsInChannelMap.map(async ([agentDid, agent]) => ({ ...agent, ...(await getCachedAgentProfile(agentDid)) }))
  );
}

function navigateToChannel() {
  uiStore.setCommunitySidebarOpen(false);

  // Use the route memory to navigate back to the last opened view in the channel if saved
  const communityId = route.params.communityId as string;
  const channelId = channel.baseExpression || "";
  const lastViewId = routeMemoryStore.getLastChannelView(communityId, channelId);
  const defaultViewId = channel.isConversation ? "conversation" : "conversations";
  router.push({ name: "view", params: { communityId, channelId, viewId: lastViewId || defaultViewId } });
}

async function deleteChannel() {
  try {
    // await channel.delete();
    // TODO get channel model first
    router.push({ name: "community", params: { communityId: route.params.communityId } });
  } catch (error) {
    console.error("Failed to delete channel:", error);
  }
}

function expandIfInNestedConversation() {
  const currentChannelId = route.params.channelId as string;
  const inNestedConversation = channel.children?.some((c) => c.baseExpression === currentChannelId);
  if (inNestedConversation) expanded.value = true;
}

onMounted(() => {
  expandIfInNestedConversation();
  findActiveAgents();
});

watch(agents, findActiveAgents, { deep: true });
watch(expanded, findActiveAgents, { deep: true });
watch(() => route.params.channelId, expandIfInNestedConversation, { immediate: true });
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
