<template>
  <div
    class="app-layout"
    :class="{ 'app-layout--show-sidebar': appStore.showMainSidebar }"
  >
    <div class="app-layout__sidebar"><slot name="sidebar"></slot></div>
    <main class="app-layout__main"><slot></slot></main>
  </div>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";

export default {
  setup() {
    return {
      appStore: useAppStore(),
    };
  },
};
</script>

<style>
.app-layout {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
}

.app-layout--show-sidebar {
  grid-template-columns: var(--app-main-sidebar-width) 1fr;
}

.app-layout--show-sidebar .app-layout__sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.app-layout__sidebar {
  background: var(--app-main-sidebar-bg-color);
  height: 100%;
  border-right: 1px var(--app-main-sidebar-border-color) solid;
  display: none;
}
.app-layout__main {
  height: 100%;
  z-index: 0;
}
</style>
