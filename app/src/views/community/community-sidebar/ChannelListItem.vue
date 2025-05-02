<template>
  <div slot="trigger">
    <j-menu-item
      tag="j-menu-item"
      class="channel"
      :class="{ 'channel--muted': channel.notifications?.mute }"
      :selected="channel.baseExpression === activeChannelId && !channel.expanded"
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
            <div
              v-if="agent.status !== 'in-call'"
              class="agent"
              :class="{ active: agent.status === 'active', asleep: agent.status === 'asleep' }"
            >
              <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
            </div>
          </template>
        </j-flex>
      </j-flex>

      <j-flex class="active-agents in-call" slot="end" v-if="activeCall">
        <template v-for="agent in activeAgents" :key="agent.did">
          <div v-if="agent.status === 'in-call'" class="agent inCall">
            <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture || null" />
          </div>
        </template>

        <RecordingIcon />
      </j-flex>
    </j-menu-item>

    <div class="channel-views" v-if="channel.expanded">
      <j-menu-item
        v-for="view in getViewOptions(channel.views)"
        :selected="channel.baseExpression === activeChannelId"
        size="sm"
        @click="() => handleChangeView(view.type)"
      >
        <j-icon size="xs" slot="start" :name="view.icon" />

        {{ view.title }}
      </j-menu-item>
    </div>
  </div>

  <j-menu slot="content" v-if="isChannelCreator">
    <j-menu-item @click="() => modals.setShowEditChannel(true)">
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
import { AgentStatus } from "@/composables/useSignallingService";
import { viewOptions as channelViewOptions } from "@/constants";
import { useAppStore, useModalStore, useUIStore } from "@/store";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { ChannelView, Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, defineOptions, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

defineOptions({ name: "ChannelListItem" });
const { channel } = defineProps({ channel: { type: Object, required: true } });

const router = useRouter();
const app = useAppStore();
const modals = useModalStore();
const ui = useUIStore();
const { me, activeCommunityId, activeChannelId } = storeToRefs(app);
const { signalingService } = useCommunityService();
const { agents } = signalingService;

const activeAgents = ref<(Profile & { status: AgentStatus })[]>([]);
const activeCall = ref(false);
const isChannelCreator = computed(() => channel.author === me.value.did);

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

async function findActiveAgents() {
  if (!agents.value) return [];

  // Find active agents in the channel
  const activeAgentsMap = Object.entries(agents.value).filter(
    ([_, agent]) => agent.channelId === channel.baseExpression && agent.status !== "offline"
  );

  // const activeAgentsMap = Object.entries(sampleAgents).filter(
  //   ([_, agent]) => agent.channelId === channel.baseExpression && agent.status !== "offline"
  // );

  // Get active agents profiles and update activeCall status if any are in a call
  let agentFoundInCall = false;
  const agentsWithProfiles = await Promise.all(
    activeAgentsMap.map(async ([agentDid, agent]) => {
      if (agent.status === "in-call") agentFoundInCall = true;
      const profile = await getCachedAgentProfile(agentDid);
      return { ...profile, status: agent.status };
    })
  );
  activeCall.value = agentFoundInCall;
  activeAgents.value = agentsWithProfiles;
}

function getIcon(view: ChannelView | string) {
  return channelViewOptions.find((o) => o.pkg === view)?.icon || "hash";
}

function navigateToChannel() {
  ui.setSidebar(false);
  router.push({ name: "channel", params: { communityId: activeCommunityId.value, channelId: channel.baseExpression } });
}

function handleChangeView(view: ChannelView) {
  // TODO: Set current channel view
  //this.dataStore.setCurrentChannelView({ channelId, view });
  navigateToChannel();
}

function getViewOptions(views: ChannelView[]) {
  return channelViewOptions.filter((o) => views.includes(o.type));
}

async function deleteChannel() {
  try {
    await channel.delete();
    router.push({ name: "community", params: { communityId: activeCommunityId.value } });
  } catch (error) {
    console.error("Failed to delete channel:", error);
  }
}

onMounted(findActiveAgents);

watch(() => agents.value, findActiveAgents, { deep: true });
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

  &.inCall {
    box-shadow: 0 0 0 1px var(--j-color-danger-400);
  }
}
</style>
