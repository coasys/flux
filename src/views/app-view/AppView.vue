<template>
  <div class="app-view">
    <left-nav></left-nav>
    <community-view></community-view>
  </div>
</template>

<script>
import LeftNav from "./../../components/left-nav/LeftNav.vue";
import CommunityView from "./../community-view/CommunityView.vue";

export default {
  components: {
    LeftNav,
    CommunityView,
  },
};
</script>


<style lang="scss" scoped>
.app-view {
  height: 100vh;
  max-height: 100vh;
  width: 100%;
  display: flex;
}
</style>