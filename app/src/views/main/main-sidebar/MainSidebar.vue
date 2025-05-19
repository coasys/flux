<template>
  <div class="sidebar-container">
    <CommunitiesList />
    <!-- <BottomSection /> -->
  </div>
</template>

<script setup lang="ts">
// import BottomSection from "./BottomSection.vue";
import CommunitiesList from "./CommunitiesList.vue";
</script>

<style scoped>
.sidebar-container {
  padding-top: var(--j-space-500);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
