<template>
  <div class="mainView">
    <main-view-top-bar :currentView="getCurrentView"></main-view-top-bar>
    <feed-view v-if="getCurrentView.type === 'feed'"> </feed-view>
    <channel-view v-if="getCurrentView.type === 'channel'"> </channel-view>
  </div>
</template>

<script>
import MainViewTopBar from "./MainViewTopBar.vue";
import FeedView from "./feed-view/FeedView.vue";
import ChannelView from "./channel-view/ChannelView.vue";
export default {
  props: ["community"],
  data() {
    return {
      currentView: "main",
      currentViewType: "feed",
      selectedComponent: "feed-view",
    };
  },
  components: {
    MainViewTopBar,
    FeedView,
    ChannelView,
  },
  computed: {
    getCurrentView() {
      return this.$store.getters.getCurrentCommunityView;
    },
  },
};
</script>

<style lang="scss">
.mainView {
  width: 100%;
  height: 100%;
  background-color: var(--junto-background-color);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
}
</style>