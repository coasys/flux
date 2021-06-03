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
