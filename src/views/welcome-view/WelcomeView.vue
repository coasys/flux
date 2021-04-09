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
import { AGENT_SERVICE_STATUS } from "../../core/graphql_queries";
import { useQuery, useResult, useMutation } from "@vue/apollo-composable";
import ad4m from "ad4m-core-executor";

import WelcomeViewHeader from "./components/WelcomeViewHeader.vue";
import WelcomeViewLeft from "./components/WelcomeViewLeft.vue";
import WelcomeViewRight from "./components/WelcomeViewRight.vue";

export default defineComponent({
  name: "Welcome",
  components: { WelcomeViewHeader, WelcomeViewLeft, WelcomeViewRight },
  mounted() {
    window.api.send("ping");
    window.api.receive("pong", (data: any) => {
      console.log(`Received pong: ${data}`);
    });

    const { onResult } = useQuery<{ agent: ad4m.AgentService }>(
      AGENT_SERVICE_STATUS
    );
    onResult((queryResult) => {
      console.log(queryResult.data);
      console.log("init", queryResult.data.agent.isInitialized);
      console.log(queryResult.loading);
      console.log(queryResult.networkStatus);
    });
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
