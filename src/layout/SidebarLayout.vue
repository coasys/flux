<template>
  <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="sidebar-layout"
    :class="{
      'sidebar-layout--closed': !open,
      'sidebar-layout--is-dragging': isDragging,
    }"
  >
    <aside
      class="sidebar-layout__drawer"
      :style="{ width: `${appStore.sidebarWidth}px` }"
      ref="sidebar"
    >
      <span
        role="presentation"
        class="sidebar-layout__resize-handle"
        @mousedown="startResize"
      ></span>
      <slot name="sidebar"></slot>
    </aside>
    <main class="sidebar-layout__main">
      <slot></slot>
    </main>
  </div>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
  data() {
    return {
      touchstartX: 0,
      touchendX: 0,
      isDragging: false,
      startX: 0,
      startWidth: 0,
    };
  },
  computed: {
    open(): boolean {
      return this.appStore.showSidebar;
    },
  },
  methods: {
    handleTouchStart(e: any) {
      this.touchstartX = e.changedTouches[0].screenX;
      console.log("start", this.touchstartX);
    },
    handleTouchEnd(e: any) {
      this.touchendX = e.changedTouches[0].screenX;
      console.log("end", this.touchendX);
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
    startResize(e: any) {
      const sidebar = this.$refs.sidebar as HTMLSpanElement;
      this.startWidth = sidebar.getBoundingClientRect().width;
      this.isDragging = true;
      this.startX = e.clientX;
      document.addEventListener("mousemove", this.doResize, false);
      document.addEventListener("mouseup", this.stopResize, false);
    },
    doResize(e: any) {
      this.appStore.setSidebarWidth(
        this.startWidth + (e.clientX - this.startX)
      );
    },
    stopResize() {
      this.isDragging = false;
      document.removeEventListener("mousemove", this.doResize);
      document.addEventListener("mouseup", this.stopResize, false);
    },
  },
});
</script>

<style>
.sidebar-layout {
  height: 100%;
  display: flex;
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
}
.sidebar-layout__toggle-button {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}
.sidebar-layout--is-dragging {
  user-select: none;
}
.sidebar-layout__drawer {
  height: 100%;
  max-height: 100vh;
  width: 300px;
  min-width: 200px;
  max-width: 33vw;
  background: var(--app-drawer-bg-color);
  overflow-y: auto;
  position: relative;
}

@media (max-width: 800px) {
  .sidebar-layout .sidebar-layout__drawer {
    height: 100%;
    width: 100% !important;
    max-width: 100%;
    background: var(--app-drawer-bg-color);
    overflow-y: auto;
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
  }
  .sidebar-layout--closed .sidebar-layout__drawer {
    opacity: 0;
  }
  .sidebar-layout .sidebar-layout__main {
    width: 100%;
    height: 100%;
    overflow: hidden;
    transform: translateX(100%);
    transition: all 0.2s ease;
  }
  .sidebar-layout--closed .sidebar-layout__main {
    transform: translateX(0);
    position: fixed;
    left: 0;
    top: 0;
    z-index: 999;
  }
}

@keyframes fade-in {
  from {
    opacity: 1;
    transform: translateX(200px);
  }
  to {
    opacity: 1;
    transform: translateX(0px);
  }
}

.sidebar-layout__main {
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
  flex: 1;
  background: var(--app-main-content-bg-color);
}
.sidebar-layout__resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  width: 3px;
  border-right: 1px solid var(--app-drawer-border-color);
  background: transparent;
  cursor: col-resize;
  height: 100%;
  z-index: 100;
  transition: all 0.2s ease;
}
.sidebar-layout__resize-handle:hover,
.sidebar-layout--is-dragging .sidebar-layout__resize-handle {
  border-right: 1px solid var(--j-color-focus);
  background: var(--j-color-focus);
}
</style>
