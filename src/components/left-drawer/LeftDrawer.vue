<template>
  <div class="left-drawer" v-if="community != null">
    <div class="left-drawer__top">
      <community-name :title="community.value.name" :description="community.value.description"></community-name>
      <left-drawer-section
        type="Feed"
        :community="community"
      ></left-drawer-section>
      <left-drawer-section
        type="Channel"
        :community="community"
      ></left-drawer-section>
    </div>
    <!-- <div class="left-drawer__bottom">
      <community-actions-button></community-actions-button>
    </div> -->
  </div>
</template>

<script>
import CommunityName from "./CommunityName.vue";
import LeftDrawerSection from "./left-drawer__section/LeftDrawerSection.vue";
//import CommunityActionsButton from "./left-drawer__section/CommunityActionsButton.vue";

export default {
  props: ["community"],
  components: { CommunityName, LeftDrawerSection },
};
</script>

<style lang="scss" scoped>
.left-drawer {
  padding: 2rem;
  width: 15vw;
  min-width: 20rem;
  background-color: var(--junto-background-color);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--junto-border-color);
  justify-content: space-between;
}
</style>
