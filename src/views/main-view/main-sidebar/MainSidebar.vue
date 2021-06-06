<template>
  <div class="left-nav">
    <communities-list></communities-list>
    <bottom-section></bottom-section>
  </div>
</template>

<script lang="ts">
import CommunitiesList from "./CommunitiesList.vue";
import BottomSection from "./BottomSection.vue";

import { useStore } from "vuex";
import { defineComponent, ref } from "vue";
import { CommunityState } from "@/store";

export default defineComponent({
  components: { CommunitiesList, BottomSection },
  setup() {
    const store = useStore();

    const joiningLink = ref("");

    const newCommunityName = ref("");
    const newCommunityDesc = ref("");

    const showModal = ref(false);
    const isCreatingCommunity = ref(false);
    const tabView = ref("Create");

    const changeCommunity = (community: CommunityState) => {
      store.commit("changeCommunity", community);
    };

    const handleCommunityClick = (community: CommunityState) => {
      changeCommunity(community);
    };

    const createCommunity = () => {
      isCreatingCommunity.value = true;
      store
        .dispatch("createCommunity", {
          perspectiveName: newCommunityName.value,
          description: newCommunityDesc.value,
        })
        .then(() => {
          showModal.value = false;
          newCommunityName.value = "";
          newCommunityDesc.value = "";
        })
        .finally(() => {
          isCreatingCommunity.value = false;
        });
    };

    const joinCommunity = () => {
      store.dispatch("joinCommunity", {
        joiningLink: joiningLink.value,
      });
    };

    return {
      joiningLink,
      joinCommunity,
      newCommunityName,
      newCommunityDesc,
      createCommunity,
      tabView,
      showModal,
      isCreatingCommunity,
      handleCommunityClick,
    };
  },

  computed: {
    getCommunities() {
      const communities = this.$store.getters.getCommunities;

      return communities;
    },
  },
});
</script>

<style lang="scss">
.left-nav {
  padding-top: var(--j-space-400);
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
