<template>
  <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="app-layout"
    :class="{ 'app-layout--show-sidebar': showMainSidebar }"
  >
    <div class="app-layout__sidebar"><slot name="sidebar"></slot></div>
    <main class="app-layout__main"><slot></slot></main>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from "@/store";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const ui = useUIStore();
const { showSidebar, showMainSidebar } = storeToRefs(ui);

const touchstartX = ref(0);
const touchendX = ref(0);

function handleTouchStart(e: any) {
  touchstartX.value = e.changedTouches[0].screenX;
}

function handleTouchEnd(e: any) {
  touchendX.value = e.changedTouches[0].screenX;
  checkDirection();
}

function checkDirection() {
  const treshold = 70;
  // Left swipe
  if (touchendX.value + treshold < touchstartX.value) {
    if (showMainSidebar) ui.setMainSidebar(false);
    else ui.setSidebar(false);
  }
  // Right swipe
  if (touchendX.value > touchstartX.value + treshold) {
    if (!showMainSidebar && showSidebar) ui.setMainSidebar(true);
    else ui.setSidebar(true);
  }
}
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
  padding-top: env(safe-area-inset-top);
  width: var(--app-main-sidebar-width);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--app-main-sidebar-bg-color);
  height: 100%;
  z-index: 10;
  border-right: 1px solid var(--app-main-sidebar-border-color, var(--j-border-color));
  transition: all 0.3s ease;
  transform: translateX(calc(var(--app-main-sidebar-width) * -1));
}

@media (max-width: 800px) {
  .app-layout__sidebar {
    z-index: 0;
  }
}

.app-layout__main {
  height: 100%;
  background: var(--app-main-bg-color);
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s ease;
  margin-left: 0;
}
</style>
