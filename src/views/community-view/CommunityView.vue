<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar :community="currentCommunity"></community-sidebar>
    </template>
    <router-view :key="$route.fullPath"></router-view>
  </sidebar-layout>

  <j-modal
    :open="modals.showCommunityMembers"
    @toggle="(e) => setShowCommunityMembers(e.target.open)"
  >
    <community-members v-if="modals.showCommunityMembers" />
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
    <j-text variant="heading">Invite people</j-text>
    <j-text variant="ingress">
      Copy and send this code to the people you want to join your community
    </j-text>
    <j-input
      @click="(e) => e.target.select()"
      size="lg"
      readonly
      :value="currentCommunity.neighbourhoodUrl"
    >
      <j-button @click="getInviteCode" variant="subtle" slot="end"
        ><j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'"
      /></j-button>
    </j-input>
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";
import { useStore, mapMutations } from "vuex";

import EditCommunity from "@/containers/EditCommunity.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import CommunityMembers from "@/containers/CommunityMembers.vue";

import { CommunityState, ModalsState } from "@/store";

export default defineComponent({
  name: "CommunityView",
  components: {
    EditCommunity,
    CreateChannel,
    CommunityMembers,
    CommunitySidebar,
    SidebarLayout,
  },
  setup() {
    const route = useRoute();
    const store = useStore();
    const hasCopied = ref(false);
    let channelWorkerLoop = null as null | Worker;
    let groupExpWorkerLoop = null as null | Worker;

    watch(
      () => route.params.communityId,
      async (id: any) => {
        if (channelWorkerLoop) {
          channelWorkerLoop.terminate();
        }
        if (groupExpWorkerLoop) {
          groupExpWorkerLoop.terminate();
        }
        if (id) {
          [channelWorkerLoop, groupExpWorkerLoop] = await store.dispatch(
            "getPerspectiveChannelsAndMetadata",
            {
              communityId: id,
            }
          );
          store.dispatch("getCommunityMembers", {
            communityId: id,
          });
        }
      },
      { immediate: true }
    );

    return {
      hasCopied,
    };
  },
  watch: {
    "currentCommunity.perspective": {
      handler: function (val) {
        if (!this.currentCommunity) return;
        const firstChannel = Object.values(this.currentCommunity.channels)[0];
        const currentChannelId =
          this.currentCommunity.currentChannelId || firstChannel.perspective;

        this.$router.push({
          name: "channel",
          params: {
            communityId: val,
            channelId: currentChannelId,
          },
        });
      },
      immediate: true,
    },
  },
  methods: {
    ...mapMutations([
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
    ]),
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      let currentCommunity = this.currentCommunity;
      const el = document.createElement("textarea");
      el.value = `Hey! Here is an invite code to join my private community on Junto: ${currentCommunity.neighbourhoodUrl}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      this.hasCopied = true;

      this.$store.commit("showSuccessToast", {
        message: "Your custom invite code is copied to your clipboard!",
      });
    },
  },
  computed: {
    modals(): ModalsState {
      return this.$store.state.ui.modals;
    },
    currentCommunity(): CommunityState {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
  },
});
</script>
