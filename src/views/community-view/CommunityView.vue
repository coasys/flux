<template>
  <div class="community-view">
    <left-drawer :community="currentCommunity"></left-drawer>
    <main-view :community="currentCommunity"></main-view>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import LeftDrawer from "../../components/left-drawer/LeftDrawer.vue";
import MainView from "./main-view/MainView.vue";
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
        console.log("Got update", params);
        startLoop(params);
      }
    );

    //Dont think we need this
    // onMounted(() => {
    //   let communityId = route.params.communityId;
    //   if (communityId != undefined) {
    //     startLoop(communityId);
    //   }
    // });

    onUnmounted(() => {
      clearInterval(noDelayRef.value);
    });

    function startLoop(communityId: string) {
      clearInterval(noDelayRef.value);
      if (communityId != null) {
        console.log("Running get channels loop");
        const test = noDelaySetInterval(async () => {
          store.dispatch("getPerspectiveChannelsAndMetadata", {
            community: store.getters.getCommunity(communityId),
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
    LeftDrawer,
    MainView,
  },
  computed: {
    currentCommunity() {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
  },
});
</script>

<style lang="scss" scoped>
.community-view {
  height: 100vh;
  max-height: 100vh;
  width: 100%;
  display: flex;
  position: relative;
}
</style>
