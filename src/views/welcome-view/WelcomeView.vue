<template>
  <div class="welcomeView">
    <welcome-view-header></welcome-view-header>
    <div class="welcomeView__container">
      <welcome-view-left></welcome-view-left>
      <welcome-view-right></welcome-view-right>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import WelcomeViewHeader from "./components/WelcomeViewHeader.vue";
import WelcomeViewLeft from "./components/WelcomeViewLeft.vue";
import WelcomeViewRight from "./components/WelcomeViewRight.vue";

export default defineComponent({
  name: "Welcome",
  components: { WelcomeViewHeader, WelcomeViewLeft, WelcomeViewRight },
  beforeCreate() {
    // window.api.send("ping");
    // window.api.receive("pong", (data: any) => {
    //   console.log(`Received pong: ${data}`);
    // });

    // const { onResult, onError } = useQuery<{ agent: ad4m.AgentService }>(
    //   AGENT_SERVICE_STATUS
    // );
    // onResult((queryResult) => {
    //   if (queryResult.data.agent.isInitialized == true) {
    //     this.$router.push("/home");
    //   }
    // });
    // onError((error) => {
    //   console.log("Got error when calling ad4m graphql:", error);
    // });
  },
});
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
