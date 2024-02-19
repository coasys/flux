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
        :key="channel.id"
      >
        <div slot="trigger">
          <j-menu-item
            tag="j-menu-item"
            class="channel"
            :class="{ 'channel--muted': channel.notifications?.mute }"
            :selected="channel.id === activeChannelId && !channel.expanded"
            @click="() => navigateToChannel(channel.id)"
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
                v-for="(agent, did) in activeAgents[channel.id]"
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
                channel.id === $route.params.channelId
              "
              size="sm"
              v-for="view in getViewOptions(channel.views)"
              @click="() => handleChangeView(channel.id, view.type)"
            >
              <j-icon size="xs" slot="start" :name="view.icon"></j-icon>
              {{ view.title }}
            </j-menu-item>
          </div>
        </div>
        <j-menu slot="content">
          <j-menu-item
            v-if="isChannelCreator(channel.id)"
            @click="() => goToEditChannel(channel.id)"
          >
            <j-icon size="xs" slot="start" name="pencil" />
            Edit Channel
          </j-menu-item>
          <j-menu-item
            v-if="isChannelCreator(channel.id)"
            @click="() => deleteChannel(channel.id)"
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
import { defineComponent, ref } from "vue";
import { mapActions } from "pinia";
import { useAppStore } from "@/store/app";
import { Channel } from "@coasys/flux-api";
import { useSubjects, useMe } from "@coasys/vue-hooks";
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

export default defineComponent({
  components: { ActiveAgent },
  props: {
    community: {
      type: Object,
      required: true,
    },
    perspective: {
      type: PerspectiveProxy,
      required: true,
    },
  },
  mounted() {
    this.neighbhourhoodProxy.addSignalHandler(this.handleBroadcastCb);

    this.polling = setInterval(() => {
      this.checkWhoIsHere();
    }, 5000);

    this.checkWhoIsHere();
  },
  unmounted() {
    clearInterval(this.polling);
    this.neighbhourhoodProxy.removeSignalHandler(this.handleBroadcastCb);
  },
  async setup(props) {
    const client: Ad4mClient = await getAd4mClient();
    const neighbhourhoodProxy = props.perspective.getNeighbourhoodProxy();
    const { me } = useMe(client.agent, profileFormatter);
    const { entries: channels, repo: channelRepo } = useSubjects({
      perspective: () => props.perspective,
      source: () => "ad4m://self",
      subject: Channel,
    });
    return {
      me,
      activeAgents: ref<Record<string, Record<string, boolean>>>({}),
      neighbhourhoodProxy,
      channelRepo,
      channels,
      userProfileImage: ref<null | string>(null),
      appStore: useAppStore(),
    };
  },
  data: function () {
    return {
      polling: null as any,
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
    checkWhoIsHere() {
      if (this.neighbhourhoodProxy) {
        this.channels.forEach((channel) => {
          this.neighbhourhoodProxy.sendBroadcastU({
            links: [
              {
                source: channel.id,
                predicate: "is-anyone-here",
                target: "just checking",
              },
            ],
          });
        });
      }
    },
    handleBroadcastCb(perspectiveExpression: PerspectiveExpression) {
      const link = perspectiveExpression.data.links[0];
      if (
        link &&
        link.author !== this.me?.did &&
        link.data.predicate === "i-am-here"
      ) {
        this.activeAgents[link.data.source] = {
          ...this.activeAgents[link.data.source],
          [link.author]: true,
        };
      }
      if (
        link &&
        link.author !== this.me?.did &&
        link.data.predicate === "leave"
      ) {
        this.activeAgents[link.data.source] = {
          ...this.activeAgents[link.data.source],
          [link.author]: false,
        };
      }
      if (
        link &&
        link.author === this.me?.did &&
        link.data.predicate === "leave" &&
        this.me?.did
      ) {
        this.activeAgents[link.data.source] = {
          ...this.activeAgents[link.data.source],
          [this.me.did]: false,
        };
      }
      if (
        link &&
        link.author === this.me?.did &&
        link.data.predicate === "peer-signal" &&
        this.me?.did
      ) {
        this.activeAgents[link.data.source] = {
          ...this.activeAgents[link.data.source],
          [this.me.did]: true,
        };
      }
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
      const channel = this.channels.find((e) => e.id === channelId);
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
      console.log({ channelViewOptions, view, channels: this.channels });
      return channelViewOptions.find((o) => o.pkg === view)?.icon || "hash";
    },
    async deleteChannel(channelId: string) {
      await this.channelRepo?.remove(channelId);
      this.$router.push({
        name: "community",
        params: {
          communityId: this.perspective.uuid,
        },
      });
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
