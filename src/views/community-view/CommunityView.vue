<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar :community="currentCommunity"></community-sidebar>
    </template>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
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
import { defineComponent, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";
import { channelRefreshDurationMs } from "@/core/juntoTypes";
import { useStore, mapMutations } from "vuex";
import sleep from "@/utils/sleep";

import EditCommunity from "@/containers/EditCommunity.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import CommunityMembers from "@/containers/CommunityMembers.vue";

import { CommunityState, ModalsState } from "@/store";

export default defineComponent({
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
    watch(
      () => route.params.communityId,
      (params: any) => {
        startLoop(params);

        store.dispatch("getCommunityMembers", {
          communityId: params,
        });
      },
      { immediate: true }
    );

    async function startLoop(communityId: string) {
      if (communityId) {
        await store.dispatch("getPerspectiveChannelsAndMetadata", {
          communityId,
        });
        await sleep(channelRefreshDurationMs);
        startLoop(communityId);
      }
    }
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
