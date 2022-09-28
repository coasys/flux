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
  grid-template-columns: 1fr;
}

.app-layout--show-sidebar .app-layout__sidebar {
  transform: translateX(0px);
}

.app-layout--show-sidebar .app-layout__main {
  margin-left: var(--app-main-sidebar-width);
}

.app-layout__sidebar {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--app-main-sidebar-width);
  display: flex;
  z-index: 999;
  flex-direction: column;
  justify-content: space-between;
  background: var(--app-main-sidebar-bg-color);
  height: 100%;
  border-right: 1px var(--app-main-sidebar-border-color) solid;
  transition: all 0.3s ease;
  transform: translateX(calc(var(--app-main-sidebar-width) * -1));
}
.app-layout__main {
  height: 100%;
  z-index: 0;
  transition: all 0.3s ease;
  margin-left: 0;
}
</style>
