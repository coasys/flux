<template>
  <div class="sidebar-container">
    <SidebarCommunities />
    <!-- <SidebarFooter /> -->
  </div>
</template>

<script setup lang="ts">
import SidebarCommunities from './SidebarCommunities.vue';
// import SidebarFooter from "./SidebarFooter.vue";
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
