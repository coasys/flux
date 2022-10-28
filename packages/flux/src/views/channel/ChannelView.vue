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
      <j-text color="black" variant="heading-md"># {{ channel.name }}</j-text>
    </div>

    <perspective-view
      class="perspective-view"
      :port="port"
      :channel="channel.id"
      :perspective-uuid="communityId"
      @agent-click="onAgentClick"
      @channel-click="onChannelClick"
      @neighbourhood-click="onNeighbourhoodClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></perspective-view>
    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e) => toggleProfile(e.target.open, activeProfile)"
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
      @toggle="(e) => toggleJoinCommunityModal(e.target.open, activeCommunity)"
    >
      <j-box v-if="activeCommunity" p="800">
        <j-flex a="center" direction="column" gap="500">
          <j-text v-if="activeCommunity.name">{{
            activeCommunity.name
          }}</j-text>
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
import ChatView from "@junto-foundation/chat-view";
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState } from "@/store/types";
import { useDataStore } from "@/store/data";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import Profile from "@/containers/Profile.vue";
import { useAppStore } from "@/store/app";

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
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const memberMentions = ref<MentionTrigger[]>([]);
    const activeProfile = ref<any>({});
    const showProfile = ref(false);
    const activeCommunity = ref<any>({});
    const showJoinCommuinityModal = ref(false);
    const isJoiningCommunity = ref(false);

    return {
      appStore,
      dataStore,
      script: null as HTMLElement | null,
      memberMentions,
      activeProfile,
      showProfile,
      showJoinCommuinityModal,
      activeCommunity,
      isJoiningCommunity,
    };
  },
  mounted() {
    if (customElements.get("perspective-view") === undefined)
      customElements.define("perspective-view", ChatView);
  },
  computed: {
    port(): number {
      // TODO: This needs to be reactive, probaly not now as we using a normal class
      return parseInt(localStorage.getItem("ad4minPort") || "") || 12000;
    },
    community(): CommunityState {
      const communityId = this.communityId;
      return this.dataStore.getCommunity(communityId as string);
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
          communityId:
            detail.uuid || this.community.neighbourhood.perspective.uuid,
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
            communityId: community.neighbourhood.perspective.uuid,
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
          communityId: this.community.neighbourhood.perspective.uuid,
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
            communityId: this.community.neighbourhood.perspective.uuid,
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
  padding: 0 var(--j-space-200);
  position: sticky;
  border-bottom: 1px solid var(--j-color-white);
  height: var(--app-header-height);
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
