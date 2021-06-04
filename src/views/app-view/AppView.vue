<template>
  <div class="app-view">
    <left-nav></left-nav>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import LeftNav from "./../../components/left-nav/LeftNav.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MainAppView",
  data() {
    return {
      isInit: false,
    };
  },
  components: {
    LeftNav,
  },
});
</script>

<style lang="scss" scoped>
.app-view {
  height: 100vh;
  max-height: 100vh;
  width: 100%;
  display: flex;
}
</style>
