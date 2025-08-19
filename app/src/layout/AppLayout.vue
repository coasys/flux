<template>
  <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="app-layout"
    :class="{ 'app-layout--show-sidebar': showAppSidebar }"
  >
    <!-- Main sidebar -->
    <div class="app-layout__sidebar"><slot name="sidebar"></slot></div>

    <!-- Desktop call window -->
    <div v-if="!isMobile" class="app-layout__desktop-call">
      <slot name="call-window"></slot>
    </div>

    <!-- Mobile call window -->
    <aside
      v-if="isMobile"
      class="app-layout__mobile-call"
      :class="{ 'app-layout__mobile-call--visible': callWindowOpen }"
    >
      <slot name="call-window"></slot>
    </aside>

    <!-- Main content -->
    <main class="app-layout__main" id="app-layout-main" :style="{ width: mainWidth }">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

const uiStore = useUiStore();
const { showCommunitySidebar, showAppSidebar, callWindowOpen, callWindowWidth, communitySidebarWidth, isMobile } =
  storeToRefs(uiStore);

const touchstartX = ref(0);
const touchendX = ref(0);

const mainWidth = computed(() => {
  const sidebarWidth = showAppSidebar.value ? "var(--app-main-sidebar-width)" : "0px";
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

.app-layout__desktop-call {
  position: absolute;
  left: 0;
  bottom: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
  z-index: 20;

  /* Hide desktop call window on mobile */
  @media (max-width: 800px) {
    display: none;
  }
}

/* Mobile Call Aside */
.app-layout__mobile-call {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #1c1a1f;
  z-index: 1000;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;

  /* Show when visible class is applied */
  &--visible {
    transform: translateY(0);
  }

  /* Only show on mobile */
  @media (min-width: 801px) {
    display: none;
  }
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
