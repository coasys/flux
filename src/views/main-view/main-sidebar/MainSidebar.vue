<template>
  <div class="sidebar-container">
    <communities-list></communities-list>
    <bottom-section></bottom-section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CommunitiesList from "./CommunitiesList.vue";
import BottomSection from "./BottomSection.vue";

export default defineComponent({
  components: { CommunitiesList, BottomSection },
});
</script>

<style scoped>
.sidebar-container {
  padding-top: var(--j-space-400);
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
