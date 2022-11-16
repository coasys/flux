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
        <div class="channel-view__tabs">
          <label class="channel-view-tab" v-for="view in filteredViewOptions">
            <input
              :name="channel.id"
              type="radio"
              :checked.prop="view.type === currentView"
              :value.prop="view.type"
              @change="changeCurrentView"
            />
            <j-icon size="xs" :name="view.icon"></j-icon>
            <span>{{ view.title }}</span>
          </label>
        </div>

        <j-button
          @click="() => (showUpdateChannelViews = true)"
          size="sm"
          variant="ghost"
        >
          <j-icon name="plus"></j-icon>
        </j-button>
      </div>
      <div class="channel-view__header-right"></div>
    </div>

    <forum-view
      v-if="currentView === ChannelView.Forum"
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
      v-if="currentView === ChannelView.Chat"
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
      :open="showUpdateChannelViews"
      @toggle="(e: any) => (showUpdateChannelViews = e.target.open)"
    >
      <UpdateChannelViews
        v-if="showUpdateChannelViews"
        @cancel="() => (showUpdateChannelViews = false)"
        @submit="() => (showUpdateChannelViews = false)"
        :channelId="channelId"
        :communityId="communityId"
      ></UpdateChannelViews>
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
import UpdateChannelViews from "@/containers/UpdateChannelViews.vue";
import { useAppStore } from "@/store/app";
import { ChannelView } from "utils/types";
import viewOptions from "utils/constants/viewOptions";

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
    UpdateChannelViews,
  },
  setup() {
    return {
      ChannelView: ChannelView,
      selectedViews: ref<ChannelView[]>([]),
      showUpdateChannelViews: ref(false),
      selectedChannelView: ref("chat"),
      appStore: useAppStore(),
      dataStore: useDataStore(),
      script: null as HTMLElement | null,
      memberMentions: ref<MentionTrigger[]>([]),
      activeProfile: ref<string>(""),
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
      return this.channel.currentView || this.channel.views[0] || "";
    },
    filteredViewOptions() {
      return viewOptions.filter((view) =>
        this.channel.views.includes(view.type)
      );
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
      return this.dataStore.channels[this.channelId];
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
        this.activeProfile = "";
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
  overflow-y: auto;
  display: block;
}

.channel-view__tabs {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
}

.channel-view-tab {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  cursor: pointer;
  position: relative;
  padding: var(--j-space-200) var(--j-space-400);
  border-radius: var(--j-border-radius);
}

.channel-view-tab:hover {
  color: var(--j-color-primary-500);
  background-color: hsla(var(--j-color-primary-hue), 100%, 50%, 0.05);
}

.channel-view-tab:has(input:checked) {
  position: relative;
  color: var(--j-color-primary-500);
}

.channel-view-tab input {
  position: absolute;
  clip: rect(1px 1px 1px 1px);
  clip: rect(1px, 1px, 1px, 1px);
  vertical-align: middle;
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
