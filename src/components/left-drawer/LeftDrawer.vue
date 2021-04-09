<template>
  <div class="left-drawer">
    <community-name :title="community.name"></community-name>
    <left-drawer-section type="Feed"></left-drawer-section>
    <left-drawer-section
      type="Channel"
      :community="community"
    ></left-drawer-section>
  </div>
</template>

<script>
import CommunityName from "./CommunityName.vue";
import LeftDrawerSection from "./left-drawer__section/LeftDrawerSection.vue";

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
}
</style>