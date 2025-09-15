<template>
  <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="app-layout"
    :class="{ 'app-layout--show-sidebar': showAppSidebar }"
  >
    <!-- Main sidebar -->
    <div
      class="app-layout__sidebar"
      :style="{ width: `${appSidebarWidth}px`, transform: `translateX(${showAppSidebar ? '0' : '-100%'})` }"
    >
      <slot name="sidebar"></slot>
    </div>

    <!-- Call container -->
    <div class="app-layout__call-container">
      <slot name="call-container"></slot>
    </div>

    <!-- Main content -->
    <main
      class="app-layout__main"
      id="app-layout-main"
      :style="{ width: mainWidth, marginLeft: showAppSidebar ? `${appSidebarWidth}px` : '0px' }"
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
const {
  appSidebarWidth,
  showCommunitySidebar,
  showAppSidebar,
  callWindowOpen,
  callWindowWidth,
  communitySidebarWidth,
} = storeToRefs(uiStore);

const touchstartX = ref(0);
const touchendX = ref(0);

const mainWidth = computed(() => {
  const sidebarWidth = showAppSidebar.value ? `${appSidebarWidth.value}px` : "0px";
  return callWindowOpen.value
    ? `calc(100% - ${callWindowWidth.value}px - ${sidebarWidth})`
    : `calc(100% - ${sidebarWidth})`;
});

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

.app-layout__sidebar {
  position: absolute;
  left: 0;
  top: 0;
  padding-top: env(safe-area-inset-top);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--app-main-sidebar-bg-color);
  height: 100%;
  z-index: 10;
  border-right: 1px solid var(--app-main-sidebar-border-color, var(--j-border-color));
  transition: all 0.3s ease;
}

@media (max-width: 800px) {
  .app-layout__sidebar {
    z-index: 0;
  }
}

.app-layout__call-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1001;
}

.app-layout__main {
  height: 100%;
  background: var(--app-main-bg-color);
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.5s ease-in-out;
  margin-left: 0;

  @media (min-width: 801px) {
    min-width: v-bind('communitySidebarWidth + "px"');
  }

  @media (max-width: 800px) {
    min-width: unset;
  }
}
</style>
