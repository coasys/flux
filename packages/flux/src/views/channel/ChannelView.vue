<template>
  <div class="channel-view" style="height: 100%">
    <div class="channel-view__header">
      <j-button
        class="channel-view__sidebar-toggle"
        variant="ghost"
        @click="() => toggleSidebar()"
      >
        <j-icon color="ui-800" size="md" name="arrow-left-short" />
      </j-button>

      <div class="channel-view__header-left">
        <j-text color="black" nomargin variant="heading-md">
          # {{ channel.name }}
        </j-text>
        <j-tabs :value="channel.currentView" @change="changeCurrentView">
          <j-tab-item size="sm" v-for="view in channel.views">
            {{ view }}
          </j-tab-item>
        </j-tabs>
        <j-button
          @click="() => (showAddChannelView = true)"
          size="sm"
          variant="ghost"
        >
          <j-icon name="plus"></j-icon>
        </j-button>
      </div>
      <div class="channel-view__header-right"></div>
    </div>

    <forum-view
      v-show="currentView === 'forum-view'"
      class="perspective-view"
      :port="port"
      :channel="channel.id"
      :perspective-uuid="communityId"
      @agent-click="onAgentClick"
      @channel-click="onChannelClick"
      @neighbourhood-click="onNeighbourhoodClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></forum-view>
    <chat-view
      v-show="currentView === 'chat-view'"
      class="perspective-view"
      :port="port"
      :channel="channel.id"
      :perspective-uuid="communityId"
      @agent-click="onAgentClick"
      @channel-click="onChannelClick"
      @neighbourhood-click="onNeighbourhoodClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></chat-view>
    <j-modal
      :open="showAddChannelView"
      @toggle="(e: any) => (showAddChannelView = e.target.open)"
    >
      <j-box p="800">
        <j-flex direction="column" gap="500">
          <j-text variant="heading-sm">Add Channel View</j-text>
          <j-tabs
            :value="selectedChannelView"
            @change="(e: any) => (selectedChannelView = e.target.value)"
          >
            <j-tab-item variant="button" value="chat">Chat</j-tab-item>
            <j-tab-item variant="button" value="forum">Forum</j-tab-item>
          </j-tabs>
          <j-button @click="addChannelView">Add View</j-button>
        </j-flex>
      </j-box>
    </j-modal>
    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e: any) => toggleProfile(e.target.open, activeProfile)"
    >
      <Profile
        :did="activeProfile"
        @openCompleteProfile="() => handleProfileClick(activeProfile)"
      />
    </j-modal>
    <j-modal
      size="xs"
      v-if="activeCommunity"
      :open="showJoinCommuinityModal"
      @toggle="(e: any) => toggleJoinCommunityModal(e.target.open, activeCommunity)"
    >
      <j-box v-if="activeCommunity" p="800">
        <j-flex a="center" direction="column" gap="500">
          <j-text v-if="activeCommunity.name">
            {{ activeCommunity.name }}
          </j-text>
          <j-text
            v-if="activeCommunity.description"
            variant="heading-sm"
            nomargin
          >
            {{ activeCommunity.description }}
          </j-text>
          <j-button
            :disabled="isJoiningCommunity"
            :loading="isJoiningCommunity"
            @click="joinCommunity"
            size="lg"
            full
            variant="primary"
          >
            Join Community
          </j-button>
        </j-flex>
      </j-box>
    </j-modal>
  </div>
</template>

<script lang="ts">
import ForumView from "@junto-foundation/forum-view";
import ChatView from "@junto-foundation/chat-view";
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState } from "@/store/types";
import { useDataStore } from "@/store/data";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import Profile from "@/containers/Profile.vue";
import { useAppStore } from "@/store/app";

const componentMap = {
  chat: "chat-view",
  forum: "forum-view",
};

interface MentionTrigger {
  label: string;
  id: string;
  trigger: string;
}

export default defineComponent({
  name: "ChannelView",
  props: ["channelId", "communityId"],
  components: {
    Profile,
  },
  setup() {
    return {
      showAddChannelView: ref(false),
      selectedChannelView: ref("chat"),
      appStore: useAppStore(),
      dataStore: useDataStore(),
      script: null as HTMLElement | null,
      memberMentions: ref<MentionTrigger[]>([]),
      activeProfile: ref<any>({}),
      showProfile: ref(false),
      showJoinCommuinityModal: ref(false),
      activeCommunity: ref<any>({}),
      isJoiningCommunity: ref(false),
    };
  },
  mounted() {
    if (!customElements.get("chat-view"))
      customElements.define("chat-view", ChatView);
    if (!customElements.get("forum-view"))
      customElements.define("forum-view", ForumView);
  },
  computed: {
    currentView(): string {
      return componentMap[this.channel.currentView || "chat"] || "chat-view";
    },
    port(): number {
      // TODO: This needs to be reactive, probaly not now as we using a normal class
      return parseInt(localStorage.getItem("ad4minPort") || "") || 12000;
    },
    community(): CommunityState {
      const communityId = this.communityId;
      return this.dataStore.getCommunityState(communityId as string);
    },
    channel(): ChannelState {
      const communityId = this.communityId;
      const channelId = this.channelId;
      return this.dataStore.getChannel(
        communityId as string,
        channelId as string
      )!;
    },
  },
  methods: {
    changeCurrentView(e: any) {
      const value = e.target.value;
      this.dataStore.setCurrentChannelView({
        channelId: this.channel.id,
        view: value,
      });
    },
    addChannelView() {
      this.dataStore
        .addChannelView({
          perspectiveUuid: this.communityId,
          channelId: this.channelId,
          view: this.selectedChannelView,
        })
        .then(() => {
          this.showAddChannelView = false;
        });
    },
    getChannelView(view: string) {
      return componentMap[view || "chat"] || "chat-view";
    },
    toggleSidebar() {
      this.appStore.toggleSidebar();
    },
    onAgentClick({ detail }: any) {
      this.toggleProfile(true, detail.did);
    },
    onChannelClick({ detail }: any) {
      this.$router.push({
        name: "channel",
        params: {
          channelId: detail.channel,
          communityId: detail.uuid || this.community.neighbourhood.uuid,
        },
      });
    },
    onNeighbourhoodClick({ detail }: any) {
      let community = this.dataStore.getCommunities.find(
        (e) => e.neighbourhood.neighbourhoodUrl === detail.url
      );

      if (!community) {
        this.toggleJoinCommunityModal(true, detail.link);
      } else {
        this.$router.push({
          name: "community",
          params: {
            communityId: community.neighbourhood.uuid,
          },
        });
      }
    },
    toggleJoinCommunityModal(open: boolean, community?: any): void {
      if (!open) {
        this.activeCommunity = undefined;
      } else {
        this.activeCommunity = community;
      }
      this.showJoinCommuinityModal = open;
    },
    joinCommunity() {
      this.isJoiningCommunity = true;
      this.dataStore
        .joinCommunity({ joiningLink: this.activeCommunity.url })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isJoiningCommunity = false;
          this.showJoinCommuinityModal = false;
        });
    },
    onHideNotificationIndicator({ detail }: any) {
      const { channelId } = this.$route.params;

      if (channelId) {
        this.dataStore.setHasNewMessages({
          communityId: this.community.neighbourhood.uuid,
          channelId: channelId as string,
          value: false,
        });
      }
    },
    toggleProfile(open: boolean, did?: any): void {
      if (!open) {
        this.activeProfile = undefined;
      } else {
        this.activeProfile = did;
      }
      this.showProfile = open;
    },
    async handleProfileClick(did: string) {
      const client = await getAd4mClient();
      this.activeProfile = did;

      const me = await client.agent.me();

      if (did === me.did) {
        this.$router.push({ name: "home", params: { did } });
      } else {
        this.$router.push({
          name: "profile",
          params: {
            did,
            communityId: this.community.neighbourhood.uuid,
          },
        });
      }
    },
  },
});
</script>

<style>
.channel-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--j-space-200);
  position: sticky;
  border-bottom: 1px solid var(--j-color-white);
  height: var(--app-header-height);
}

.channel-view__header-left {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
}

.perspective-view {
  height: calc(100% - var(--app-header-height));
  display: block;
}

@media (min-width: 800px) {
  .channel-view__sidebar-toggle {
    display: none;
  }
  .channel-view__header {
    padding: 0 var(--j-space-500);
  }
}
</style>
