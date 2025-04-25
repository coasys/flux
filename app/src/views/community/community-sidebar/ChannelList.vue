<template>
  <j-box pt="500" pb="800">
    <j-menu-group open title="Channels">
      <j-button
        @click.prevent="() => setShowCreateChannel(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>

      <j-popover
        event="contextmenu"
        placement="bottom-start"
        v-for="channel in channels"
        :key="channel.baseExpression"
      >
        <div slot="trigger">
          <j-menu-item
            tag="j-menu-item"
            class="channel"
            :class="{ 'channel--muted': channel.notifications?.mute }"
            :selected="channel.baseExpression === activeChannelId && !channel.expanded"
            @click="() => navigateToChannel(channel.baseExpression)"
          >
            <j-flex slot="start" gap="300" a="center">
              <j-icon size="xs" :name="getIcon(channel.views[0])" />
              
              {{ channel.name }}

              <div class="channel__notification" v-if="channel.hasNewMessages"></div>

              <div class="active-agents">
                <template
                  v-for="(agentState, did) in activeAgents[channel.baseExpression]"
                  :key="did"
                >
                  <ActiveAgent v-if="agentState?.inChannel" :key="did" :did="`${did}`" />
                </template>
              </div>
            </j-flex>


            <div class="active-agents in-call" slot="end"  v-if="activeCall(channel.baseExpression)">
              <div class="recording-icon">
                <div class="icon1" />
                <div class="icon2" />
              </div>
              <template
                v-for="(agentState, did) in activeAgents[channel.baseExpression]"
                :key="did"
              >
                <ActiveAgent v-if="agentState?.inCall" :key="did" :did="`${did}`" inCall />
              </template>
            </div>
          </j-menu-item>
          <div class="channel-views" v-if="channel.expanded">
            <j-menu-item
              :selected="
                view.type === channel.currentView &&
                channel.baseExpression === $route.params.channelId
              "
              size="sm"
              v-for="view in getViewOptions(channel.views)"
              @click="() => handleChangeView(channel.baseExpression, view.type)"
            >
              <j-icon size="xs" slot="start" :name="view.icon"></j-icon>
              {{ view.title }}
            </j-menu-item>
          </div>
        </div>
        <j-menu slot="content">
          <j-menu-item
            v-if="isChannelCreator(channel.baseExpression)"
            @click="() => goToEditChannel(channel.baseExpression)"
          >
            <j-icon size="xs" slot="start" name="pencil" />
            Edit Channel
          </j-menu-item>
          <j-menu-item
            v-if="isChannelCreator(channel.baseExpression)"
            @click="() => deleteChannel(channel.baseExpression)"
          >
            <j-icon size="xs" slot="start" name="trash" />
            Delete Channel
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-menu-group>
    <j-menu-item @click="() => setShowCreateChannel(true)">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { mapActions } from "pinia";
import { useAppStore } from "@/store/app";
import { Channel } from "@coasys/flux-api";
import { useMe, useModel } from "@coasys/ad4m-vue-hooks";
import { ChannelView } from "@coasys/flux-types";
import { viewOptions as channelViewOptions } from "@/constants";
import {
  Ad4mClient,
  NeighbourhoodProxy,
  PerspectiveProxy,
  PerspectiveExpression,
} from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import ActiveAgent from "./ActiveAgent.vue";
import { profileFormatter } from "@coasys/flux-utils";
import { IS_ANYONE_HERE, I_AM_HERE, PEER_SIGNAL, LEAVE } from "@coasys/flux-webrtc";

type AgentState = { inChannel?: boolean; inCall?: boolean };
type ActiveAgents = { [channelId: string]: { [did: string]: AgentState } };

const IS_ANYONE_IN_A_CHANNEL = "is-anyone-in-a-channel";
const I_AM_IN_CHANNEL = "i-am-in-channel";
const I_AM_LEAVING_CHANNEL = "i-am-leaving-channel";
const POLLING_INTERVAL = 5000;

export default defineComponent({
  components: { ActiveAgent },
  props: {
    community: {
      type: Object,
      required: true,
    },
    perspective: {
      type: Object, // PerspectiveProxy,
      required: true,
    },
  },
  mounted() {
    // Add signal handler
    this.neighbhourhoodProxy?.addSignalHandler(this.onSignal);

    // If in a channel, let the neighbourhood know
    if (this.activeChannelId) this.signalPresenceInChannel(this.activeChannelId);

    // Check who else is in the neighbourhoods channels
    this.checkWhoIsInChannels(this.activeChannelId || "");

    // Set up polling that periodically rechecks agents are still present incase their connection has dropped
    this.pollingInterval = setInterval(() => {
      // Iterate over all channels in activeAgents
      Object.keys(this.activeAgents || {}).forEach((channelId) => {
        // Skip if the channel has no active agents
        if (!this.activeAgents[channelId]) return;

        // Keep only agents who responded during the polling interval
        this.activeAgents[channelId] = Object.fromEntries(
          Object.entries(this.activeAgents[channelId]).map(([did]) => {
            const inChannelSignal = this.pollingSignals.find((s) => s.channelId === channelId && s.author === did && s.state.inChannel);
            const inCallSignal = this.pollingSignals.find((s) => s.channelId === channelId && s.author === did && s.state.inCall);
            return [did, { inChannel: !!inChannelSignal, inCall: !!inCallSignal } ];
          })
            .filter(([did, agentState]) => {
              // Keep only agents that are in the channel or in a call
              return (agentState as AgentState).inChannel || (agentState as AgentState).inCall;
            })
        );
      });

      // Reset the polling signals for the next interval
      this.pollingSignals = [];

      // Trigger another check to broadcast and collect responses
      this.checkWhoIsInChannels(this.activeChannelId || "");
    }, POLLING_INTERVAL);
  },
  unmounted() {
    // Signal leaving channel
    if (this.activeChannelId) this.signalLeavingChannel(this.activeChannelId);

    // Remove signal handler
    this.neighbhourhoodProxy?.removeSignalHandler(this.onSignal);

    // Clear polling interval
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  },
  async setup(props) {
    const client: Ad4mClient = await getAd4mClient();
    const neighbhourhoodProxy = props.perspective.getNeighbourhoodProxy();
    const { me } = useMe(client.agent, profileFormatter);

    const { entries: channels } = useModel({
      perspective: computed(() => props.perspective as PerspectiveProxy),
      model: Channel,
      query: { source: "ad4m://self" },
    });

    return {
      me,
      activeAgents: ref<ActiveAgents>({}),
      neighbhourhoodProxy,
      channels,
      userProfileImage: ref<null | string>(null),
      appStore: useAppStore(),
      pollingInterval: null as NodeJS.Timeout | null,
      pollingSignals: ref<{ author: string, channelId: string, state: AgentState }[]>([]),
    };
  },
  data: () => {
    return {
      neighbhourhoodProxy: null as NeighbourhoodProxy | null,
      showCommunityMenu: false,
      communityImage: null,
    };
  },
  computed: {
    activeChannelId() {
      return this.$route.params.channelId as string;
    },
    activeCall() {
      return (channelId: string) => {
        const channelState = this.activeAgents[channelId] || {};
        return Object.values(channelState).some((agentState) => agentState.inCall);
      };
    },
  },
  methods: {
    onSignal(expression: PerspectiveExpression) {
      const link = expression.data.links[0];
      if (!link) return;

      const { author, data } = link;
      const { source, predicate } = data;

      // Handle channel signals sent from this component
      if (predicate === IS_ANYONE_IN_A_CHANNEL && this.activeChannelId) {
        this.signalPresenceInChannel(this.activeChannelId);
        this.pollingSignals.push({ author, channelId: source, state: { inChannel: true } });
      }

      if (predicate === I_AM_IN_CHANNEL) {
        const channelState = this.activeAgents[source] || {}
        const agentState = channelState[author] || {};
        const newAgentState = { ...agentState, inChannel: true };
        this.activeAgents[source] = { ...channelState, [author]: newAgentState };
        this.pollingSignals.push({ author, channelId: source, state: newAgentState });
      }

      if (predicate === I_AM_LEAVING_CHANNEL) {
        const channelState = this.activeAgents[source] || {}
        const agentState = channelState[author] || {};
        const newAgentState = { ...agentState, inChannel: false };
        this.activeAgents[source] = { ...channelState, [author]: newAgentState };
      }

      // Handle WebRTC signals sent from the WebRTC Manager
      if ([IS_ANYONE_HERE, I_AM_HERE, PEER_SIGNAL].includes(predicate)) {
        const channelState = this.activeAgents[source] || {}
        const agentState = channelState[author] || {};
        const newAgentState = { ...agentState, inCall: true };
        this.activeAgents[source] = { ...channelState, [author]: newAgentState };
        this.pollingSignals.push({ author, channelId: source, state: newAgentState });
      }

      if ([LEAVE].includes(predicate)) {
        const channelState = this.activeAgents[source] || {}
        const agentState = channelState[author] || {};
        const newAgentState = { ...agentState, inCall: false };
        this.activeAgents[source] = { ...channelState, [author]: newAgentState };
      }

    },
    signalPresenceInChannel(channelId: string) {
      this.neighbhourhoodProxy?.sendBroadcastU({
        links: [{ source: channelId, predicate: I_AM_IN_CHANNEL, target: "" }],
      });
    },
    signalLeavingChannel(channelId: string) {
      this.neighbhourhoodProxy?.sendBroadcastU({
        links: [{ source: channelId, predicate: I_AM_LEAVING_CHANNEL, target: "" }],
      });
    },
    checkWhoIsInChannels(channelId: string) {
      this.neighbhourhoodProxy?.sendBroadcastU({
        links: [{ source: channelId, predicate: IS_ANYONE_IN_A_CHANNEL, target: "" }],
      });
    },
    ...mapActions(useAppStore, ["setSidebar", "setShowCreateChannel"]),
    handleToggleClick(channelId: string) {
      // TODO: Toggle channel collapse
    },
    goToEditChannel(id: string) {
      this.appStore.setActiveChannel(id);
      this.appStore.setShowEditChannel(true);
    },
    handleChangeView(channelId: string, view: ChannelView) {
      // TODO: Set current channel view
      //this.dataStore.setCurrentChannelView({ channelId, view });
      this.navigateToChannel(channelId);
    },
    navigateToChannel(channelName: string) {
      this.setSidebar(false);
      this.$router.push({
        name: "channel",
        params: {
          communityId: this.perspective.uuid,
          channelId: channelName,
        },
      });
    },
    isChannelCreator(channelId: string): boolean {
      const channel = this.channels.find((e) => e.baseExpression === channelId);
      if (channel) {
        return channel.author === this.me?.did;
      } else {
        throw new Error("Did not find channel");
      }
    },
    getViewOptions(views: ChannelView[]) {
      return channelViewOptions.filter((o) => views.includes(o.type));
    },
    getIcon(view: ChannelView) {
      //console.log({ channelViewOptions, view, channels: this.channels });
      return channelViewOptions.find((o) => o.pkg === view)?.icon || "hash";
    },
    async deleteChannel(channelId: string) {
      try {
        const channel = new Channel(this.perspective as PerspectiveProxy, channelId);
        await channel.delete();
        this.$router.push({ name: "community", params: { communityId: this.perspective.uuid } });
      } catch (error) {
        console.error("Failed to delete channel:", error);
      }
    },
  },
  watch: {
    async activeChannelId(newChannel, oldChannel) {
      if (newChannel !== oldChannel) {
        if (oldChannel) this.signalLeavingChannel(oldChannel);
        if (newChannel) this.signalPresenceInChannel(newChannel);
      }
    },
  },
});
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

.active-agents {
  display: flex;
  align-items: center;
  gap: var(--j-space-100);
  margin-left: 10px;
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
