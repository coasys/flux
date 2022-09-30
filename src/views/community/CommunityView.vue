<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar :community="community"></community-sidebar>
    </template>

    <div
      style="height: 100%"
      v-for="channel in channels"
      :key="channel.id"
      :style="{
        height:
          channel.id === channelId && channel.sourcePerspective === communityId
            ? '100%'
            : '0',
      }"
    >
      <channel-view
        v-if="loadedChannels[channel.id]"
        v-show="
          channel.id === channelId && channel.sourcePerspective === communityId
        "
        :channelId="channel.id"
        :communityId="channel.sourcePerspective"
      ></channel-view>
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
      v-if="modals.showEditCommunity"
      @submit="() => setShowEditCommunity(false)"
      @cancel="() => setShowEditCommunity(false)"
    />
  </j-modal>

  <j-modal
    size="sm"
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
      <j-text variant="heading">Invite people</j-text>
      <j-text variant="ingress">
        Copy and send this code to the people you want to join your community
      </j-text>
      <j-input
        @click="(e) => e.target.select()"
        size="lg"
        readonly
        :value="community.neighbourhood.neighbourhoodUrl"
      >
        <j-button @click.stop="getInviteCode" variant="ghost" slot="end"
          ><j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'"
        /></j-button>
      </j-input>
    </j-box>
  </j-modal>

  <j-modal
    :open="modals.showCommunitySettings"
    @toggle="(e) => setShowCommunitySettings(e.target.open)"
  >
    <community-settings />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";

import EditCommunity from "@/containers/EditCommunity.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import CommunityMembers from "@/containers/CommunityMembers.vue";
import CommunitySettings from "@/containers/CommunitySettings.vue";
import ChannelView from "@/views/channel/ChannelView.vue";

import { CommunityState, ModalsState, ChannelState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { mapActions, mapState } from "pinia";

type LoadedChannels = {
  [channelId: string]: boolean;
};

export default defineComponent({
  name: "CommunityView",
  components: {
    EditCommunity,
    CreateChannel,
    ChannelView,
    CommunityMembers,
    CommunitySidebar,
    CommunitySettings,
    SidebarLayout,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    return {
      loadedChannels: ref<LoadedChannels>({}),
      appStore,
      dataStore,
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
          this.dataStore.fetchNeighbourhoodMembers(id);
          this.dataStore.fetchNeighbourhoodMetadata(id);
          this.dataStore.fetchNeighbourhoodChannels(id);
          this.handleThemeChange(id);
          this.goToActiveChannel(id);
        }
      },
      immediate: true,
    },
    "$route.params.channelId": {
      handler: function (id: string) {
        if (id) {
          this.dataStore.setCurrentChannelId({
            communityId: this.communityId,
            channelId: id,
          });

          const channel = this.dataStore.getChannel(this.communityId, id);

          if (channel) {
            this.loadedChannels = {
              ...this.loadedChannels,
              [channel.id]: true,
            };
          }
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
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    goToActiveChannel(communityId: string) {
      if (!communityId) return;
      const firstChannel = this.dataStore.getChannelStates(communityId)[0].id;
      const currentChannelId =
        this.community.state.currentChannelId || firstChannel;

      if (currentChannelId) {
        this.$router.push({
          name: "channel",
          params: {
            communityId,
            channelId: currentChannelId,
          },
        });
      }
    },
    handleThemeChange(id: string) {
      if (!id) {
        this.appStore.changeCurrentTheme("global");
        return;
      } else {
        this.appStore.changeCurrentTheme(
          this.community.state?.useLocalTheme ? id : "global"
        );
      }
    },
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      const url = this.community.neighbourhood.neighbourhoodUrl;
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
    communityId() {
      return this.$route.params.communityId as string;
    },
    channelId() {
      return this.$route.params.channelId as string;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
    community(): CommunityState {
      const communityId = this.communityId;
      return this.dataStore.getCommunity(communityId);
    },
    channels(): ChannelState[] {
      const channels = this.dataStore.getChannels;

      return channels;
    },
  },
});
</script>
