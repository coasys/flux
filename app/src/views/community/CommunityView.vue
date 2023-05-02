<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar
        v-if="community?.id && data.perspective?.uuid"
        :perspective="data.perspective"
        :community="community"
        :isSynced="isSynced"
      ></community-sidebar>
    </template>

    <div
      style="height: 100%"
      v-for="channel in channels"
      :key="channel.id"
      :style="{
        height: channel.id === channelId ? '100%' : '0',
      }"
    >
      <channel-view
        v-if="loadedChannels[channel.id] && channel?.id === channelId"
        :channelId="channel.id"
        :communityId="data.perspective?.uuid"
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
            :initials="community.name?.charAt(0)"
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
              {{ channel.name }}
            </button>
          </div>
        </j-flex>
      </div>

      <div
        class="center"
        v-if="isSynced && !channelId && channels.length === 0"
      >
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
    </div>
  </sidebar-layout>

  <j-modal
    size="sm"
    :open="modals.showCommunityMembers"
    @toggle="(e) => setShowCommunityMembers(e.target.open)"
  >
    <community-members
      @close="() => setShowCommunityMembers(false)"
      v-if="modals.showCommunityMembers"
    />
  </j-modal>

  <j-modal
    size="sm"
    :open="modals.showEditCommunity"
    @toggle="(e) => setShowEditCommunity(e.target.open)"
  >
    <edit-community
      :communityId="communityId"
      v-if="modals.showEditCommunity"
      @submit="() => setShowEditCommunity(false)"
      @cancel="() => setShowEditCommunity(false)"
    />
  </j-modal>

  <j-modal
    :open="modals.showCreateChannel"
    @toggle="(e) => setShowCreateChannel(e.target.open)"
  >
    <create-channel
      v-if="modals.showCreateChannel"
      @submit="() => setShowCreateChannel(false)"
      @cancel="() => setShowCreateChannel(false)"
    />
  </j-modal>

  <j-modal
    size="sm"
    :open="modals.showInviteCode"
    @toggle="(e) => setShowInviteCode(e.target.open)"
  >
    <j-box p="800">
      <j-box pb="500">
        <j-text variant="heading">Invite people</j-text>
        <j-text variant="body">
          Copy and send this code to the people you want to join your community
        </j-text>
      </j-box>
      <j-input
        @click="(e) => e.target.select()"
        size="lg"
        readonly
        :value="data.perspective?.sharedUrl"
      >
        <j-button @click.stop="getInviteCode" variant="ghost" slot="end"
          ><j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'"
        /></j-button>
      </j-input>
    </j-box>
  </j-modal>

  <j-modal
    v-if="modals.showEditChannel && appStore.activeChannel"
    :open="modals.showEditChannel"
    @toggle="(e) => setShowEditChannel(e.target.open)"
  >
    <EditChannel
      v-if="modals.showEditChannel"
      @cancel="() => setShowEditChannel(false)"
      @submit="() => setShowEditChannel(false)"
      :channelId="appStore.activeChannel"
    ></EditChannel>
  </j-modal>

  <j-modal
    :open="modals.showCommunitySettings"
    @toggle="(e) => setShowCommunitySettings(e.target.open)"
  >
    <community-settings />
  </j-modal>

  <j-modal
    :open="modals.showCommunityTweaks"
    @toggle="(e) => setShowCommunityTweaks(e.target.open)"
  >
    <community-tweaks v-if="modals.showCommunityTweaks" />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRoute } from "vue-router";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";

import EditCommunity from "@/containers/EditCommunity.vue";
import EditChannel from "@/containers/EditChannel.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import CommunityMembers from "@/containers/CommunityMembers.vue";
import CommunitySettings from "@/containers/CommunitySettings.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import CommunityTweaks from "@/containers/CommunityTweaks.vue";
import Avatar from "@/components/avatar/Avatar.vue";
import Hourglass from "@/components/hourglass/Hourglass.vue";

import { Channel, Community } from "utils/api";
import { ModalsState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { useDataStore } from "@/store/data";
import { mapActions, mapState } from "pinia";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { useEntries, useEntry } from "utils/vue";
import { usePerspective } from "utils/vue";

type LoadedChannels = {
  [channelId: string]: boolean;
};

export default defineComponent({
  name: "CommunityView",
  components: {
    EditCommunity,
    EditChannel,
    CreateChannel,
    ChannelView,
    CommunityMembers,
    CommunitySidebar,
    CommunitySettings,
    SidebarLayout,
    CommunityTweaks,
    Avatar,
    Hourglass,
  },
  async setup() {
    const route = useRoute();
    const client = await getAd4mClient();
    const { data } = usePerspective(client, () => route.params.communityId);

    const { entry: community } = useEntry({
      perspective: () => data.value.perspective,
      model: Community,
    });

    const { entries: channels } = useEntries({
      perspective: () => data.value.perspective,
      source: () => community.value && community.value.id,
      model: Channel,
    });

    return {
      community,
      channels,
      data,
      loadedChannels: ref<LoadedChannels>({}),
      appStore: useAppStore(),
      dataStore: useDataStore(),
      userStore: useUserStore(),
    };
  },
  data() {
    return {
      hasCopied: false,
    };
  },
  watch: {
    "$route.params.communityId": {
      handler: function (id: string) {
        if (id) {
          this.handleThemeChange(id);
          this.goToActiveChannel(id);
        } else {
          this.handleThemeChange();
        }
      },
      immediate: true,
    },
    "$route.params.channelId": {
      handler: function (id: string) {
        if (id) {
          /*
          this.dataStore.setCurrentChannelId({
            communityId: this.communityId,
            channelId: id,
          });
          */

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
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, [
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowEditChannel",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
      "setShowCommunityTweaks",
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
    goToActiveChannel(communityId: string) {
      const channels = this.dataStore.getChannelStates(communityId);
      if (channels.length > 0) {
        const firstChannel = this.dataStore.getChannelStates(communityId)[0].id;
        const currentChannelId =
          this.communityState.state.currentChannelId || firstChannel;

        if (currentChannelId) {
          this.$router.push({
            name: "channel",
            params: {
              communityId,
              channelId: currentChannelId,
            },
          });
        }
      }
    },
    handleThemeChange(id?: string) {
      if (!id) {
        this.appStore.changeCurrentTheme("global");
        return;
      } else {
        this.appStore.changeCurrentTheme(
          this.communityState.state?.useLocalTheme ? id : "global"
        );
      }
    },
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      const url = this.data.perspective?.sharedUrl;
      const el = document.createElement("textarea");
      el.value = `Hey! Here is an invite code to join my private community on Flux: ${url}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      this.hasCopied = true;

      this.appStore.showSuccessToast({
        message: "Your custom invite code is copied to your clipboard!",
      });
    },
  },
  computed: {
    communityState() {
      return this.dataStore.getCommunityState(
        this.$route.params.communityId as string
      );
    },
    isSynced(): boolean {
      return true;
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
