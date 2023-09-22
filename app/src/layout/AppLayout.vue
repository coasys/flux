<template>
  <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="app-layout"
    :class="{ 'app-layout--show-sidebar': appStore.showMainSidebar }"
  >
    <div class="app-layout__sidebar"><slot name="sidebar"></slot></div>
    <main class="app-layout__main"><slot></slot></main>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { useAppStore } from "@/store/app";

export default defineComponent({
  setup() {
    return {
      appStore: useAppStore(),
      touchstartX: ref(0),
      touchendX: ref(0),
    };
  },
  methods: {
    handleTouchStart(e: any) {
      this.touchstartX = e.changedTouches[0].screenX;
    },
    handleTouchEnd(e: any) {
      this.touchendX = e.changedTouches[0].screenX;
      this.checkDirection();
    },
    checkDirection() {
      const treshold = 70;
      // left swipe
      if (this.touchendX + treshold < this.touchstartX) {
        if (this.appStore.showMainSidebar) {
          this.appStore.setMainSidebar(false);
        } else {
          this.appStore.setSidebar(false);
        }
      }
      // right swipe
      if (this.touchendX > this.touchstartX + treshold) {
        if (!this.appStore.showMainSidebar && this.appStore.showSidebar) {
          this.appStore.setMainSidebar(true);
        } else {
          this.appStore.setSidebar(true);
        }
      }
    },
  },
});
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
  flex-direction: column;
  justify-content: space-between;
  background: var(--app-main-sidebar-bg-color);
  height: 100%;
  z-index: 10;
  border-right: 1px solid
    var(--app-main-sidebar-border-color, var(--j-border-color));
  transition: all 0.3s ease;
  transform: translateX(calc(var(--app-main-sidebar-width) * -1));
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
