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
    <community-members />
  </j-modal>

  <j-modal
    :open="modals.showEditCommunity"
    @toggle="(e) => setShowEditCommunity(e.target.open)"
  >
    <edit-community
      @submit="() => setShowEditCommunity(false)"
      @cancel="() => setShowEditCommunity(false)"
    />
  </j-modal>

  <j-modal
    :open="modals.showCreateChannel"
    @toggle="(e) => setShowCreateChannel(e.target.open)"
  >
    <create-channel
      @submit="() => setShowCreateChannel(false)"
      @cancel="() => setShowCreateChannel(false)"
    />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, onUnmounted, watch } from "vue";
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
    let channelWorkerLoop = null as null | Worker;
    let groupExpWorkerLoop = null as null | Worker;

    watch(
      () => route.params.communityId,
      async (params: any) => {
        if (channelWorkerLoop) {
          channelWorkerLoop.terminate();
        }
        if (groupExpWorkerLoop) {
          groupExpWorkerLoop.terminate();
        }
        [channelWorkerLoop, groupExpWorkerLoop] = await store.dispatch(
          "getPerspectiveChannelsAndMetadata",
          {
            communityId: params,
          }
        );
        store.dispatch("getCommunityMembers", {
          communityId: params,
        });
      },
      { immediate: true }
    );
  },
  methods: {
    ...mapMutations([
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
    ]),
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
