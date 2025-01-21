<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar
        v-if="community?.name && data.perspective?.uuid"
        :perspective="data.perspective"
        :community="community"
        :isSynced="isSynced"
      ></community-sidebar>
    </template>

    <div
      style="height: 100%"
      v-for="channel in channels"
      :key="channel?.id"
      :style="{
        height: channel?.id === channelId ? '100%' : '0',
      }"
    >
      <channel-view
        v-if="loadedChannels[channel?.id]"
        v-show="channel?.id === channelId"
        :channelId="channel?.id"
        :communityId="communityId"
      ></channel-view>
    </div>

    <div v-if="!isSynced && !channelId" class="center">
      <j-box py="800">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-box pb="500">
            <Hourglass></Hourglass>
          </j-box>
          <j-flex direction="column" a="center">
            <j-text color="black" size="700" weight="800">
              Syncing community
            </j-text>
            <j-text size="400" weight="400"
              >Note: Flux is P2P, you will not receive any data until another
              user is online
            </j-text>
          </j-flex>
        </j-flex>
      </j-box>
    </div>

    <div
      class="center"
      v-if="isSynced && !channelId && community && channels.length"
    >
      <div class="center-inner">
        <j-flex gap="600" direction="column" a="center" j="center">
          <Avatar
            :initials="`${community?.name}`.charAt(0)"
            size="xxl"
            :url="community.thumbnail || null"
          ></Avatar>
          <j-box align="center" pb="300">
            <j-text variant="heading"> Welcome to {{ community.name }} </j-text>
            <j-text variant="ingress">Pick a channel</j-text>
          </j-box>

          <div class="channel-card-grid">
            <button
              class="channel-card"
              @click="() => navigateToChannel(channel.id)"
              v-for="channel in channels"
            >
              # {{ channel.name }}
            </button>
          </div>
        </j-flex>
      </div>
    </div>

    <div class="center" v-if="isSynced && !channelId && channels.length === 0">
      <div class="center-inner">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-icon color="ui-500" size="xl" name="balloon"></j-icon>
          <j-flex direction="column" a="center">
            <j-text nomargin color="black" size="700" weight="800">
              No channels yet
            </j-text>
            <j-text size="400" weight="400">Be the first to make one!</j-text>
            <j-button
              variant="primary"
              @click="() => setShowCreateChannel(true)"
            >
              Create a new channel
            </j-button>
          </j-flex>
        </j-flex>
      </div>
    </div>
  </sidebar-layout>
</template>

<script lang="ts">
import SidebarLayout from "@/layout/SidebarLayout.vue";
import { defineComponent, ref } from "vue";
import { useRoute } from "vue-router";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";

import Avatar from "@/components/avatar/Avatar.vue";
import Hourglass from "@/components/hourglass/Hourglass.vue";
import ChannelView from "@/views/channel/ChannelView.vue";

import { useAppStore } from "@/store/app";
import { ModalsState } from "@/store/types";
import { PerspectiveState } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import {
  usePerspective,
  usePerspectives,
  useSubjects,
} from "@coasys/ad4m-vue-hooks";
import { Channel, Community } from "@coasys/flux-api";
import { useCommunities } from "@coasys/flux-vue";
import { mapActions } from "pinia";
import { registerNotification } from "../../utils/registerMobileNotifications";

type LoadedChannels = {
  [channelId: string]: boolean;
};

export default defineComponent({
  name: "CommunityView",
  components: {
    ChannelView,
    CommunitySidebar,
    SidebarLayout,
    Avatar,
    Hourglass,
  },
  async setup() {
    registerNotification();
    const route = useRoute();
    const client = await getAd4mClient();
    const { data } = usePerspective(client, () => route.params.communityId);

    const { neighbourhoods } = usePerspectives(client);

    const { communities } = useCommunities(neighbourhoods);

    const { entries: channels } = useSubjects({
      perspective: () => data.value.perspective,
      subject: Channel,
    });

    return {
      communities,
      channels,
      data,
      hasCopied: ref(false),
      loadedChannels: ref<LoadedChannels>({}),
      appStore: useAppStore(),
    };
  },
  watch: {
    "$route.params.communityId": {
      handler: function (id: string) {
        if (id) {
          this.handleThemeChange(id);
        } else {
          this.handleThemeChange();
        }
      },
      deep: true,
      immediate: true,
    },
    "$route.params.channelId": {
      handler: function (id: string) {
        if (id) {
          this.loadedChannels = {
            ...this.loadedChannels,
            [id]: true,
          };
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowEditChannel",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    navigateToChannel(channelId: string) {
      this.$router.push({
        name: "channel",
        params: {
          communityId: this.communityId,
          channelId: channelId,
        },
      });
    },
    handleThemeChange(id?: string) {
      if (!id) {
        this.appStore.changeCurrentTheme("global");
        return;
      } else {
        // TODO: Change community theme
        // this.appStore.changeCurrentTheme(
        //   this.communityState.state?.useLocalTheme ? id : "global"
        // );
      }
    },
  },
  computed: {
    isSynced(): boolean {
      return this.data.perspective?.state === PerspectiveState.Synced;
    },
    community(): Community | null {
      return this.communities[this.$route.params.communityId as string];
    },
    communityId() {
      return this.$route.params.communityId as string;
    },
    channelId() {
      return this.$route.params.channelId as string;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
});
</script>

<style scoped>
.center {
  height: 100%;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-inner {
  display: block;
  width: 100%;
  max-height: 100%;
  padding: var(--j-space-500);
}

.channel-card-grid {
  display: grid;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--j-space-500);
}

.channel-card {
  background-color: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  color: inherit;
  font-size: inherit;
  display: block;
  width: 100%;
  font-weight: 600;
  padding: var(--j-space-500);
  border: 1px solid var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
}

.channel-card:hover {
  border: 1px solid var(--j-color-primary-500);
}
</style>
