<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar :community="currentCommunity"></community-sidebar>
    </template>
    <router-view></router-view>
  </sidebar-layout>
</template>

<script lang="ts">
import { defineComponent, onUnmounted, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";
import { channelRefreshDurationMs } from "@/core/juntoTypes";
import { useStore } from "vuex";

export default defineComponent({
  setup() {
    const route = useRoute();
    const store = useStore();

    let noDelayRef: any = ref();

    watch(
      () => route.params.communityId,
      (params: any) => {
        clearInterval(noDelayRef.value);
        startLoop(params);

        store.dispatch("getCommunityMembers", {
          communityId: params,
        });
      },
      { immediate: true }
    );

    onUnmounted(() => {
      clearInterval(noDelayRef.value);
    });

    function startLoop(communityId: string) {
      clearInterval(noDelayRef.value);
      if (communityId) {
        console.log("Running get channels loop");
        const test = noDelaySetInterval(async () => {
          store.dispatch("getPerspectiveChannelsAndMetadata", {
            communityId,
          });
        }, channelRefreshDurationMs);

        noDelayRef.value = test;
      }
    }

    //TODO: @leif idk the best place to put this
    function noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
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
