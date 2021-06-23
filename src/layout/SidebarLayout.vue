<template>
  <div
    class="sidebar-layout"
    :class="{
      'sidebar-layout--closed': !open,
      'sidebar-layout--is-dragging': isDragging,
    }"
  >
    <aside class="sidebar-layout__drawer" ref="sidebar">
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
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      isDragging: false,
      startX: 0,
      startWidth: 0,
    };
  },
  computed: {
    open() {
      return this.$store.state.ui.showSidebar;
    },
  },
  methods: {
    startResize(e: any) {
      const sidebar = this.$refs.sidebar as HTMLSpanElement;
      this.startWidth = sidebar.getBoundingClientRect().width;
      this.isDragging = true;
      this.startX = e.clientX;
      document.addEventListener("mousemove", this.doResize, false);
      document.addEventListener("mouseup", this.stopResize, false);
    },
    doResize(e: any) {
      const sidebar = this.$refs.sidebar as HTMLSpanElement;
      sidebar.style.width = `${this.startWidth + (e.clientX - this.startX)}px`;
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
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  display: flex;
  transition: all 0.2s ease;
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
  width: 300px;
  background: var(--app-drawer-bg-color);
  overflow-y: auto;
  position: relative;
  transition: all 0.2s ease;
}
.sidebar-layout--closed .sidebar-layout__drawer {
  width: 0px !important;
}
.sidebar-layout__main {
  width: 100%;
  max-height: 100vh;
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
  border-right: 1px solid var(--j-focus-color);
  background: var(--j-focus-color);
}
</style>
