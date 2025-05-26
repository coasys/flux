<template>
  <div slot="trigger">
    <j-menu-item
      tag="j-menu-item"
      class="channel"
      :class="{ 'channel--muted': channel.notifications?.mute }"
      :selected="channel.baseExpression === route.params.channelId && !channel.expanded"
      @click="navigateToChannel"
    >
      <j-flex slot="start" gap="400" a="center">
        <j-flex gap="300">
          <j-icon size="xs" :name="getIcon(channel.views[0])" />
          {{ channel.name }}
        </j-flex>

        <div class="channel__notification" v-if="channel.hasNewMessages" />

        <j-flex>
          <template v-for="agent in activeAgents" :key="agent.did">
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
    </j-menu-item>
  </div>

  <j-menu slot="content" v-if="isChannelCreator">
    <j-menu-item @click="() => (modalStore.showEditChannel = true)">
      <j-icon size="xs" slot="start" name="pencil" />
      Edit Channel
    </j-menu-item>

    <j-menu-item @click="deleteChannel">
      <j-icon size="xs" slot="start" name="trash" />
      Delete Channel
    </j-menu-item>
  </j-menu>
</template>

<script setup lang="ts">
import RecordingIcon from "@/components/recording-icon/RecordingIcon.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { viewOptions as channelViewOptions } from "@/constants";
import { useAppStore, useModalStore, useRouteMemoryStore, useUiStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { AgentState, ChannelView, Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, defineOptions, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

type AgentData = Profile & AgentState;

defineOptions({ name: "ChannelListItem" });
const { channel } = defineProps({ channel: { type: Object, required: true } });

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();
const uiStore = useUiStore();
const routeMemoryStore = useRouteMemoryStore();
const { me } = storeToRefs(appStore);
const { signallingService } = useCommunityService();
const { agents } = signallingService;

const agentsInChannel = ref<AgentData[]>([]);

const isChannelCreator = computed(() => channel.author === me.value.did);
const activeAgents = computed(() =>
  agentsInChannel.value.filter(
    (agent) =>
      !["offline", "invisible"].includes(agent.status) &&
      (!agent.callRoute || agent.callRoute.channelId !== channel.baseExpression)
  )
);
const agentsInCall = computed(() =>
  agentsInChannel.value.filter((agent) => agent.callRoute?.channelId === channel.baseExpression)
);

// // Commented out code for testing active agents UI
// const did1 = "did:key:z6MkqC5MxR8PothBSq5AVmkqzm7MuMn6CoWVq1Yqgciubw54";
// const did2 = "did:key:z6MkqC5MxR8PothBSq5AVmkqzm7MuMn6CaWVq1Yqgciubw55";
// const did3 = "did:key:z6MkqC5MxR8PothBSq5AVmkqzm7MuMn6CoWVq1Yqgciubw56";
// const did4 = "did:key:z6MkhSJjcAEd1jURga1K4NVPMqCV6R6NCh98WT2irUMnHqv1";
// const channelId = channel.baseExpression as string;

// const sampleAgents = {
//   [me.value.did]: { did: me.value.did, status: "in-call", channelId },
//   [did4]: { did: did4, status: "in-call", channelId },
//   [did2]: { did: did2, status: "in-call", channelId },
//   [did3]: { did: did3, status: "active", channelId },
//   [did1]: { did: did1, status: "asleep", channelId },
// } as Record<string, { did: string; status: AgentStatus; channelId: string }>;

async function findAgentsInChannel() {
  if (!agents.value) return [];

  // Include all agents with the channel ID in their currenRoute or their callRoute
  const agentsInChannelMap = Object.entries(agents.value).filter(([_, agent]) => {
    const inChannel = agent.currentRoute?.channelId === channel.baseExpression;
    const inCall = agent.callRoute?.channelId === channel.baseExpression;
    return inChannel || inCall;
  });

  // Get each agents profile
  agentsInChannel.value = await Promise.all(
    agentsInChannelMap.map(async ([agentDid, agent]) => ({ ...agent, ...(await getCachedAgentProfile(agentDid)) }))
  );
}

function getIcon(view: ChannelView | string) {
  return channelViewOptions.find((o) => o.pkg === view)?.icon || "hash";
}

function navigateToChannel() {
  uiStore.setCommunitySidebarOpen(false);

  // Use the route memory to navigate back to the last opened view in the channel if saved
  const communityId = route.params.communityId as string;
  const channelId = channel.baseExpression;
  const lastViewId = routeMemoryStore.getLastChannelView(communityId, channelId);
  if (lastViewId) router.push({ name: "view", params: { communityId, channelId, viewId: lastViewId } });
  else router.push({ name: "channel", params: { communityId, channelId } });
}

async function deleteChannel() {
  try {
    await channel.delete();
    router.push({ name: "community", params: { communityId: route.params.communityId } });
  } catch (error) {
    console.error("Failed to delete channel:", error);
  }
}

onMounted(findAgentsInChannel);

watch(() => agents.value, findAgentsInChannel, { deep: true });
</script>

<style lang="scss" scoped>
.channel {
  position: relative;
  display: block;
}

.channel--muted {
  opacity: 0.6;
}

.channel-views {
  margin-left: var(--j-space-400);
}

.channel__notification {
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
</style>
