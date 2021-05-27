<template>
  <div class="community-view">
    <left-drawer :community="currentCommunity"></left-drawer>
    <main-view :community="currentCommunity"></main-view>
  </div>
</template>

<script>
import LeftDrawer from "../../components/left-drawer/LeftDrawer.vue";
import MainView from "./main-view/MainView.vue";
export default {
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
};
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
