<template>
  <div class="app-view">
    <left-nav></left-nav>
    <community-view></community-view>
  </div>
</template>

<script lang="ts">
import LeftNav from "./../../components/left-nav/LeftNav.vue";
import CommunityView from "./../community-view/CommunityView.vue";

import { defineComponent } from "vue";
import { PERSPECTIVES } from "../../core/graphql_queries";
import { useQuery } from "@vue/apollo-composable";
import { AGENT_SERVICE_STATUS } from "../../core/graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import { databasePerspectiveName } from "../../core/juntoTypes";

export default defineComponent({
  name: "MainAppView",
  data() {
    return {
      isInit: false,
    };
  },
  beforeCreate() {
    const { onResult, onError } =
      useQuery<{
        agent: ad4m.AgentService;
      }>(AGENT_SERVICE_STATUS);
    onResult((val) => {
      this.isInit = val.data.agent.isInitialized!;
      this.$store.commit({ type: "updateAgentLockState", value: false });
      if (this.isInit) {
        //Get database perspective from store
        let databasePerspective = this.$store.getters.getDatabasePerspective;
        if (databasePerspective == "") {
          console.warn(
            "Does not have databasePerspective in store but has already been init'd! Add logic for getting databasePerspective as found with name",
            databasePerspectiveName
          );
          //TODO: add the retrieval/state saving logic here
        }
      } else {
        this.$router.push("/signup");
      }
    });
  },
  components: {
    LeftNav,
    CommunityView,
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
