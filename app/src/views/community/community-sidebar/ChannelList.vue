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
            {{ channel.name }}
            <div
              slot="end"
              class="channel__notification"
              v-if="channel.hasNewMessages"
            ></div>
            <j-icon
              slot="start"
              size="xs"
              :name="getIcon(channel.views[0])"
            ></j-icon>
            <div class="active-agents">
              <j-box
                v-for="(agent, did) in activeAgents[channel.baseExpression]"
                :key="did"
              >
                <ActiveAgent :key="did" :did="did" v-if="agent" />
              </j-box>
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
    this.checkWhoIsInChannels();

    // Set up polling that periodically rechecks agents are still present incase their connection has dropped
    this.pollingInterval = setInterval(() => {
      // Iterate over all channels in activeAgents
      Object.keys(this.activeAgents || {}).forEach((channelId) => {
        // Skip if the channel has no active agents
        if (!this.activeAgents[channelId]) return;

        // Keep only agents who responded during the polling interval
        this.activeAgents[channelId] = Object.fromEntries(
          Object.keys(this.activeAgents[channelId])
            .filter((did) => this.pollingSignals.includes(did)) // Filter agents who responded
            .map((did) => [did, true]) // Mark them as active
        );
      });

      // Reset the polling signals for the next interval
      this.pollingSignals = [];

      // Trigger another check to broadcast and collect responses
      this.checkWhoIsInChannels();
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
      activeAgents: ref<Record<string, Record<string, boolean>>>({}),
      neighbhourhoodProxy,
      channels,
      userProfileImage: ref<null | string>(null),
      appStore: useAppStore(),
      pollingInterval: null as NodeJS.Timeout | null,
      pollingSignals: ref<string[]>([]),
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
  },
  methods: {
    onSignal(expression: PerspectiveExpression) {
      const link = expression.data.links[0];
      if (!link) return;

      const { author, data } = link;
      const { source, predicate } = data;

      if (predicate === IS_ANYONE_IN_A_CHANNEL && this.activeChannelId) {
        this.signalPresenceInChannel(this.activeChannelId);
        this.pollingSignals.push(author);
      }

      if (predicate === I_AM_IN_CHANNEL) {
        this.activeAgents[source] = { ...(this.activeAgents[source] || {}), [author]: true };
        this.pollingSignals.push(author);
      }

      if (predicate === I_AM_LEAVING_CHANNEL) {
        this.activeAgents[source] = { ...(this.activeAgents[source] || {}), [author]: false };
        this.pollingSignals.push(author);
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
    checkWhoIsInChannels() {
      this.neighbhourhoodProxy?.sendBroadcastU({
        links: [{ source: "", predicate: IS_ANYONE_IN_A_CHANNEL, target: "" }],
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

<style scoped>
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
}

.active-agents {
  display: flex;
  align-items: center;
  position: absolute;
  gap: var(--j-space-100);
  right: var(--j-space-400);
  top: 50%;
  transform: translateY(-50%);
}
</style>
