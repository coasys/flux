<template>
  <div class="sidebar-container">
    <top-section></top-section>
    <communities-list></communities-list>
    <bottom-section></bottom-section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CommunitiesList from "./CommunitiesList.vue";
import BottomSection from "./BottomSection.vue";
import TopSection from "./TopSection.vue";

export default defineComponent({
  components: { CommunitiesList, BottomSection, TopSection },
});
</script>

<style scoped>
.sidebar-container {
  padding-top: var(--j-space-700);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
