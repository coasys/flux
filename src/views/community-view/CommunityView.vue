<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar :community="currentCommunity"></community-sidebar>
    </template>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </sidebar-layout>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";
import { channelRefreshDurationMs } from "@/core/juntoTypes";
import { useStore } from "vuex";
import sleep from "@/utils/sleep";

export default defineComponent({
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
  components: {
    CommunitySidebar,
    SidebarLayout,
  },
  computed: {
    currentCommunity() {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
  },
});
</script>
