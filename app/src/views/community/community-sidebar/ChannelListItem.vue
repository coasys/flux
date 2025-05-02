<template>
  <div slot="trigger">
    <j-menu-item
      tag="j-menu-item"
      class="channel"
      :class="{ 'channel--muted': channel.notifications?.mute }"
      :selected="channel.baseExpression === activeChannelId && !channel.expanded"
      @click="navigateToChannel"
    >
      <j-flex slot="start" gap="300" a="center">
        <j-icon size="xs" :name="getIcon(channel.views[0])" />

        {{ channel.name }}

        <div class="channel__notification" v-if="channel.hasNewMessages"></div>

        <div class="active-agents">
          <template v-for="agent in activeAgents" :key="agent.did">
            <div v-if="agent.status !== 'in-call'" class="agent">
              <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture" />
            </div>
          </template>
        </div>
      </j-flex>

      <div class="active-agents in-call" slot="end" v-if="activeCall">
        <div class="recording-icon">
          <div class="icon1" />
          <div class="icon2" />
        </div>

        <template v-for="agent in activeAgents" :key="agent.did">
          <div v-if="agent.status === 'in-call'" class="agent inCall">
            <j-avatar size="xxs" :hash="agent.did" :src="agent.profileThumbnailPicture" />
          </div>
        </template>
      </div>
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

  <j-menu slot="content">
    <j-menu-item v-if="isChannelCreator" @click="() => modals.setShowEditChannel(true)">
      <j-icon size="xs" slot="start" name="pencil" />
      Edit Channel
    </j-menu-item>

    <j-menu-item v-if="isChannelCreator" @click="deleteChannel">
      <j-icon size="xs" slot="start" name="trash" />
      Delete Channel
    </j-menu-item>
  </j-menu>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { viewOptions as channelViewOptions } from "@/constants";
import { useAppStore, useModalStore, useUIStore } from "@/store";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { ChannelView } from "@coasys/flux-types";
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

const activeAgents = ref<Awaited<ReturnType<typeof findActiveAgents>>>([]);
const activeCall = ref(false);
const isChannelCreator = computed(() => channel.author === me.value.did);

async function findActiveAgents() {
  if (!agents.value) return [];

  // Find active agents in the channel
  const activeAgents = Object.entries(agents.value).filter(
    ([_, agent]) => agent.channelId === channel.baseExpression && agent.status !== "offline"
  );

  // Get active agents profiles and update activeCall status if any are in a call
  let agentFoundInCall = false;
  const agentsWithProfiles = await Promise.all(
    activeAgents.map(async ([agentDid, agent]) => {
      if (agent.status === "in-call") agentFoundInCall = true;
      const profile = await getCachedAgentProfile(agentDid);
      return { ...profile, status: agent.status };
    })
  );
  activeCall.value = agentFoundInCall;
  return agentsWithProfiles;
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

// Update on component mount
onMounted(findActiveAgents);

// Watch for changes in the agents state
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
  margin-left: 10px;
}

.agent {
  height: 20px;
  z-index: 1;

  &:not(:first-child) {
    margin-left: -10px;
  }

  &.inCall {
    border-radius: 50%;
    box-shadow: 0 0 0 1px #e62b63;
  }
}

.recording-icon {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20px;
  width: 20px;
  margin-right: 10px;

  $speed: 1.8s;

  @keyframes pulse1 {
    0% {
      transform: scale(0.4);
    }
    25% {
      transform: scale(0.5);
    }
    50% {
      transform: scale(0.4);
    }
    100% {
      transform: scale(0.4);
    }
  }

  @keyframes pulse2 {
    0% {
      transform: scale(0.4);
      opacity: 0.8;
    }
    50% {
      transform: scale(1);
      opacity: 0;
    }
    100% {
      transform: scale(0.4);
      opacity: 0;
    }
  }

  .icon1,
  .icon2 {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #e62b63;
  }

  .icon1 {
    animation: pulse1 $speed ease-in infinite;
  }

  .icon2 {
    animation: pulse2 $speed ease-in infinite;
  }
}
</style>
