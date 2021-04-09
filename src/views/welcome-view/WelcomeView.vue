<template>
  <div class="welcomeView">
    <welcome-view-header></welcome-view-header>
    <div class="welcomeView__container">
      <welcome-view-left></welcome-view-left>
      <welcome-view-right></welcome-view-right>
    </div>
  </div>
</template>

<script>
import WelcomeViewHeader from "./components/WelcomeViewHeader.vue";
import WelcomeViewLeft from "./components/WelcomeViewLeft.vue";
import WelcomeViewRight from "./components/WelcomeViewRight.vue";
export default {
  components: { WelcomeViewHeader, WelcomeViewLeft, WelcomeViewRight },
};
</script>

<style lang="scss" scoped>
.welcomeView {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;

  &__container {
    display: flex;
  }
}
</style>
