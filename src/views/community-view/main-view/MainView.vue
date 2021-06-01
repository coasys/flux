<template>
  <div class="mainView" v-if="community && channel">
    <main-view-top-bar
      :community="community"
      :channel="channel"
    ></main-view-top-bar>
    <channel-view :channel="channel" :community="community"> </channel-view>
  </div>
</template>

<script>
import MainViewTopBar from "./MainViewTopBar.vue";
import ChannelView from "./channel-view/ChannelView.vue";

export default {
  props: ["community"],
  components: {
    MainViewTopBar,
    ChannelView,
  },
  computed: {
    channel() {
      const { channelId, communityId } = this.$route.params;
      return this.$store.getters.getChannel({ channelId, communityId });
    },
  },
};
</script>

<style lang="scss">
.mainView {
  width: 100%;
  height: 100%;
  background-color: var(--j-color-white);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
}
</style>
