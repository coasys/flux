<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar></community-sidebar>
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
        v-if="loadedChannels[channel.id]"
        v-show="channel.id === channelId"
        :channelId="channel.id"
        :communityId="channel.sourcePerspective"
      ></channel-view>
    </div>
    <div v-if="!isSynced" class="center">
      <j-box py="800">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-box pb="500">
            <j-spinner></j-spinner>
          </j-box>
          <j-flex direction="column" a="center">
            <j-text color="black" size="700" weight="800">
              Syncing community
            </j-text>
            <j-text size="400" weight="400">Please wait...</j-text>
          </j-flex>
        </j-flex>
      </j-box>
    </div>
    <div
      class="center"
      v-if="
        isSynced &&
        channels.filter((c) => c.sourcePerspective === communityId).length === 0
      "
    >
      <j-box py="800">
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
      </j-box>
    </div>
  </sidebar-layout>

  <j-modal
    size="sm"
    :open="modals.showCommunityMembers"
    @toggle="(e: any) => setShowCommunityMembers(e.target.open)"
  >
    <community-members
      @close="() => setShowCommunityMembers(false)"
      v-if="modals.showCommunityMembers"
    />
  </j-modal>

  <j-modal
    size="sm"
    :open="modals.showEditCommunity"
    @toggle="(e: any) => setShowEditCommunity(e.target.open)"
  >
    <edit-community
      v-if="modals.showEditCommunity"
      @submit="() => setShowEditCommunity(false)"
      @cancel="() => setShowEditCommunity(false)"
    />
  </j-modal>

  <j-modal
    :open="modals.showCreateChannel"
    @toggle="(e: any) => setShowCreateChannel(e.target.open)"
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
    @toggle="(e: any) => setShowInviteCode(e.target.open)"
  >
    <j-box p="800">
      <j-text variant="heading">Invite people</j-text>
      <j-text variant="ingress">
        Copy and send this code to the people you want to join your community
      </j-text>
      <j-input
        @click="(e: any) => e.target.select()"
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
    @toggle="(e: any) => setShowCommunitySettings(e.target.open)"
  >
    <community-settings />
  </j-modal>

  <j-modal
    :open="modals.showCommunityTweaks"
    @toggle="(e: any) => setShowCommunityTweaks(e.target.open)"
  >
    <community-tweaks v-if="modals.showCommunityTweaks" />
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
import CommunityTweaks from "@/containers/CommunityTweaks.vue";

import ChannelModel, { Channel } from "utils/api/channel";
import MemberModel, { Member } from "utils/api/member";
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
    CommunityTweaks,
  },
  setup() {
    return {
      memberModel: ref<MemberModel | null>(null),
      channelModel: ref<ChannelModel | null>(null),
      loadedChannels: ref<LoadedChannels>({}),
      appStore: useAppStore(),
      dataStore: useDataStore(),
      isSynced: ref(true),
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
          this.dataStore.fetchCommunityMembers(id);
          this.dataStore.fetchCommunityMetadata(id);
          this.dataStore.fetchCommunityChannels(id);
          this.startWatching(id);
          this.handleThemeChange(id);
          this.goToActiveChannel(id);
        } else {
          this.channelModel && this.channelModel.unsubscribe();
          this.memberModel && this.memberModel.unsubscribe();
          this.handleThemeChange();
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

          const channel = this.dataStore.getChannel(id);

          if (channel) {
            this.isSynced = true;
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
      "setShowCommunityTweaks",
    ]),
    startWatching(id: string) {
      this.channelModel && this.channelModel.unsubscribe();
      this.memberModel && this.memberModel.unsubscribe();

      this.channelModel = new ChannelModel({ perspectiveUuid: id });
      this.memberModel = new MemberModel({ perspectiveUuid: id });

      this.memberModel.onAdded((member: Member) => {
        this.dataStore.setNeighbourhoodMember({
          did: member.did,
          perspectiveUuid: id,
        });
      });

      this.channelModel.onRemoved((id) => {
        this.dataStore.removeChannel({ channelId: id });
      });

      this.channelModel.onAdded((channel: Channel) => {
        console.log("on channel add");
        this.dataStore.addChannel({
          communityId: id,
          channel: {
            id: channel.id,
            name: channel.name,
            timestamp: new Date(channel.timestamp),
            author: channel.author,
            collapsed: false,
            sourcePerspective: id,
            currentView: channel.views[0],
            views: channel.views,
            hasNewMessages: false,
            notifications: {
              mute: false,
            },
          },
        });
      });
    },
    goToActiveChannel(communityId: string) {
      const channels = this.dataStore.getChannelStates(communityId);
      if (channels.length > 0) {
        this.isSynced = true;
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
      } else {
        this.isSynced = false;
      }
    },
    handleThemeChange(id?: string) {
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
      return this.dataStore.getCommunityState(communityId);
    },
    channels(): ChannelState[] {
      const channels = this.dataStore.getChannels;

      return channels;
    },
  },
});
</script>

<style scoped>
.center {
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  display: flex;
}
</style>
