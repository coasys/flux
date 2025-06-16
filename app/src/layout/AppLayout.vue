<template>
  <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="app-layout"
    :class="{ 'app-layout--show-sidebar': showAppSidebar }"
  >
    <div class="app-layout__sidebar"><slot name="sidebar"></slot></div>
    <div class="app-layout__webrtc"><slot name="webrtc"></slot></div>
    <main
      class="app-layout__main"
      id="app-layout-main"
      :style="{ width: mainWidth, minWidth: `${communitySidebarWidth}px` }"
    >
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

const uiStore = useUiStore();
const { showCommunitySidebar, showAppSidebar, callWindowOpen, callWindowWidth, communitySidebarWidth } =
  storeToRefs(uiStore);

const touchstartX = ref(0);
const touchendX = ref(0);

const mainWidth = computed(() =>
  callWindowOpen.value
    ? `calc(100% - ${callWindowWidth.value}px - var(--app-main-sidebar-width))`
    : "calc(100% - var(--app-main-sidebar-width))"
);

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
    if (showAppSidebar) uiStore.setAppSidebarOpen(false);
    else uiStore.setCommunitySidebarOpen(false);
  }
  // Right swipe
  if (touchendX.value > touchstartX.value + treshold) {
    if (!showAppSidebar && showCommunitySidebar) uiStore.setAppSidebarOpen(true);
    else uiStore.setCommunitySidebarOpen(true);
  }
}
</script>

<style lang="scss">
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

.app-layout__webrtc {
  position: absolute;
  left: 0;
  bottom: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
  z-index: 20;
}

.app-layout__main {
  height: 100%;
  background: var(--app-main-bg-color);
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.5s ease-in-out;
  margin-left: 0;
}
</style>
