<template>
  <div
    class="channel-view"
    style="height: 100%"
    :class="{ expanded: isExpanded }"
  >
    <div class="channel-view__header">
      <j-button
        class="channel-view__sidebar-toggle"
        variant="ghost"
        @click="() => toggleSidebar()"
      >
        <j-icon color="ui-800" size="md" name="arrow-left-short" />
      </j-button>

      <div class="channel-view__header-actions">
        <div class="channel-view__header-left">
          <j-box pr="500">
            <j-flex a="center" gap="200">
              <j-icon name="hash" size="md" color="ui-300"></j-icon>
              <j-text color="black" weight="700" size="500" nomargin>
                {{ channel.name }}
              </j-text>
            </j-flex>
          </j-box>
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
            <j-tooltip placement="auto" title="Manage views">
              <j-button
                v-if="sameAgent"
                @click="() => goToEditChannel(channel.id)"
                size="sm"
                variant="ghost"
              >
                <j-icon size="md" name="plus"></j-icon>
              </j-button>
            </j-tooltip>
          </div>
        </div>
      </div>
      <div class="channel-view__header-right">
        <j-tooltip
          placement="auto"
          :title="isExpanded ? 'Minimize' : 'Fullsize'"
        >
          <j-button size="sm" variant="ghost">
            <j-icon
              size="sm"
              :name="
                isExpanded ? 'arrows-angle-contract' : 'arrows-angle-expand'
              "
              @click="isExpanded = !isExpanded"
            ></j-icon>
          </j-button>
        </j-tooltip>
      </div>
    </div>

    <forum-view
      v-show="currentView === ChannelView.Forum"
      v-if="filteredViewOptions.find((v) => v.type === ChannelView.Forum)"
      class="perspective-view"
      :source="channel.id"
      :perspective="communityId"
      @click="onViewClick"
      @agent-click="onAgentClick"
      @channel-click="onChannelClick"
      @neighbourhood-click="onNeighbourhoodClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></forum-view>
    <graph-view
      v-show="currentView === ChannelView.Graph"
      v-if="filteredViewOptions.find((v) => v.type === ChannelView.Graph)"
      class="perspective-view"
      :source="channel.id"
      :perspective="communityId"
      @click="onViewClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></graph-view>
    <webrtc-view
      v-show="currentView === ChannelView.Voice"
      v-if="filteredViewOptions.find((v) => v.type === ChannelView.Voice)"
      class="perspective-view"
      :source="channel.id"
      :perspective="communityId"
      @click="onViewClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></webrtc-view>
    <webrtc-debug-view
      v-show="currentView === ChannelView.Debug"
      v-if="filteredViewOptions.find((v) => v.type === ChannelView.Debug)"
      class="perspective-view"
      :source="channel.id"
      :perspective="communityId"
      @click="onViewClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></webrtc-debug-view>
    <chat-view
      v-show="currentView === ChannelView.Chat"
      v-if="filteredViewOptions.find((v) => v.type === ChannelView.Chat)"
      class="perspective-view"
      :source="channel.id"
      :perspective="communityId"
      @click="onViewClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></chat-view>

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
    <j-modal size="xs" v-if="isJoiningCommunity" :open="isJoiningCommunity">
      <j-box p="500" align="center">
        <Hourglass width="30px"></Hourglass>
        <j-text variant="heading">Joining community</j-text>
        <j-text>Please wait...</j-text>
      </j-box>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState } from "@/store/types";
import { useDataStore } from "@/store/data";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import Profile from "@/containers/Profile.vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { ChannelView } from "utils/types";
import { viewOptions } from "@/constants";
import Hourglass from "@/components/hourglass/Hourglass.vue";

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
    Hourglass,
  },
  setup() {
    return {
      ChannelView: ChannelView,
      selectedViews: ref<ChannelView[]>([]),
      showEditChannel: ref(false),
      selectedChannelView: ref("chat"),
      appStore: useAppStore(),
      dataStore: useDataStore(),
      userStore: useUserStore(),
      script: null as HTMLElement | null,
      memberMentions: ref<MentionTrigger[]>([]),
      activeProfile: ref<string>(""),
      showProfile: ref(false),
      isJoiningCommunity: ref(false),
      isExpanded: ref(false),
    };
  },
  async mounted() {
    if (!customElements.get("chat-view")) {
      const module = await import(`@fluxapp/chat-view`);
      customElements.define("chat-view", module.default);
    }
    if (!customElements.get("forum-view")) {
      const module = await import(`@fluxapp/forum-view`);
      customElements.define("forum-view", module.default);
    }
    if (!customElements.get("graph-view")) {
      const module = await import(`@fluxapp/graph-view`);
      customElements.define("graph-view", module.default);
    }
    if (!customElements.get("webrtc-view")) {
      const module = await import(`@fluxapp/webrtc-view`);
      customElements.define("webrtc-view", module.default);
    }
    if (!customElements.get("webrtc-debug-view")) {
      const module = await import(`flux-webrtc-debug-view`);
      customElements.define("webrtc-debug-view", module.default);
    }
  },
  computed: {
    sameAgent() {
      return this.channel.author === this.userStore.agent.did;
    },
    currentView(): string {
      return this.channel.currentView || this.channel.views[0] || "";
    },
    filteredViewOptions() {
      return viewOptions.filter((view) =>
        this.channel.views.includes(view.type)
      );
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
    onViewClick(e: any) {
      const parentLink = e.target.closest("a");
      if (parentLink) {
        const url = parentLink.href;

        if (url.startsWith("neighbourhood://")) {
          this.onNeighbourhoodClick(url);
        }

        if (url.startsWith("did:")) {
          this.onAgentClick(url);
        }

        if (url.startsWith("literal://")) {
          this.onChannelClick(url);
        }

        if (!url.startsWith("http")) {
          console.log("test");
          e.preventDefault();
        }
      }
    },

    goToEditChannel(id: string) {
      this.appStore.setActiveChannel(id);
      this.appStore.setShowEditChannel(true);
    },
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
    onAgentClick(did: string) {
      this.toggleProfile(true, did);
    },
    onChannelClick(channel: string) {
      this.$router.push({
        name: "channel",
        params: {
          channelId: channel,
          communityId: this.community.neighbourhood.uuid,
        },
      });
    },
    onNeighbourhoodClick(url: any) {
      let community = this.dataStore.getCommunities.find(
        (e) => e.neighbourhood.neighbourhoodUrl === url
      );

      if (!community) {
        this.joinCommunity(url);
      } else {
        this.$router.push({
          name: "community",
          params: {
            communityId: community.neighbourhood.uuid,
          },
        });
      }
    },
    joinCommunity(url: string) {
      this.isJoiningCommunity = true;
      this.dataStore
        .joinCommunity({ joiningLink: url })
        .then((community) => {
          this.$router.push({
            name: "community",
            params: {
              communityId: community.neighbourhood.uuid,
            },
          });
        })
        .finally(() => {
          this.isJoiningCommunity = false;
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
.expanded {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 999999;
}

.channel-view {
  background: var(--app-channel-bg-color, transparent);
}

.channel-view__header {
  display: flex;
  align-items: center;
  gap: var(--j-space-400);
  padding: 0 var(--j-space-200);
  position: sticky;
  background: var(--app-channel-header-bg-color, transparent);
  border-bottom: 1px solid
    var(--app-channel-header-border-color, var(--j-border-color));
  height: var(--app-header-height);
}

.channel-view__header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  height: 100%;
}

.channel-view__header-left {
  display: flex;
  align-items: center;
  height: 100%;
  gap: var(--j-space-300);
}

.channel-view__header-right {
  align-self: center;
}

.perspective-view {
  height: calc(100% - var(--app-header-height));
  overflow-y: auto;
  display: block;
}

.channel-view__tabs {
  display: flex;
  height: 100%;
  align-items: center;
  gap: var(--j-space-500);
}

.channel-view-tab {
  height: 100%;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  color: var(--j-color-ui-500);
  font-size: var(--j-font-size-500);
  cursor: pointer;
  position: relative;
  padding: var(--j-space-200) 0;
  border-bottom: 1px solid transparent;
}

.channel-view-tab:hover {
  color: var(--j-color-black);
}

.channel-view-tab:has(input:checked) {
  position: relative;
  border-bottom: 1px solid var(--j-color-primary-500);
  color: var(--j-color-black);
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
    justify-content: space-between;
    gap: 0;
  }
}
</style>
