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

export default defineComponent({
  name: "MainAppView",
  // setup() {
  //   const {
  //     onResult: getPerspectives,
  //     onError: getPerspectivesError,
  //   } = useQuery<{
  //     perspectives: [ad4m.Perspective];
  //   }>(PERSPECTIVES);

  //   return {
  //     getPerspectives,
  //     getPerspectivesError,
  //   };
  // },
  // mounted() {
  //   this.getPerspectives((perspectives) => {
  //     console.log("Found perspectives", perspectives);
  //     if (perspectives.data.perspectives.length > 0) {
  //       for (var i = 0; i < perspectives.data.perspectives.length; i++) {
  //         if (
  //           this.$store.getters.getCommunityById(
  //             perspectives.data.perspectives[i].uuid
  //           ) == undefined
  //         ) {
  //           //NOTE: this logic is actually incorrect; there is no mapping between perspective -> community
  //           //since a community can contain more than one perspective (one for each channel)
  //           //There is also the possiblity that we add a database perspective in the future and of course this will also not be a community
  //           this.$store.commit({
  //             type: "addCommunity",
  //             value: {
  //               name: perspectives.data.perspectives[i].name,
  //               channels: [],
  //               perspective: perspectives.data.perspectives[i].uuid,
  //               expressionLanguages:
  //                 perspectives.data.perspectives[i].sharedPerspective
  //                   ?.requiredExpressionLanguages,
  //             },
  //           });
  //         }
  //       }
  //     }
  //   });
  // },
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
  background-color: var(--junto-background-color);
}
</style>
