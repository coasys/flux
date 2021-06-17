<template>
  <div
    class="sidebar-layout"
    :class="{
      'sidebar-layout--closed': !open,
      'sidebar-layout--is-dragging': isDragging,
    }"
  >
    <aside class="sidebar-layout__sidebar" ref="sidebar">
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
      const sidebarWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
      this.startWidth = sidebarWidth;
      this.isDragging = true;
      this.startX = e.clientX;
      document.addEventListener("mousemove", this.doResize, false);
      document.addEventListener("mouseup", this.stopResize, false);
    },
    doResize(e: any) {
      const sidebar = this.$refs.sidebar as HTMLSpanElement;
      sidebar.style.width = `${this.startWidth + e.clientX - this.startX}px`;
    },
    stopResize() {
      this.isDragging = false;
      document.removeEventListener("mousemove", this.doResize);
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
.sidebar-layout__sidebar {
  height: 100%;
  width: 300px;
  overflow-y: auto;
  position: relative;
  transition: all 0.2s ease;
}
.sidebar-layout--closed .sidebar-layout__sidebar {
  width: 0px !important;
}
.sidebar-layout__main {
  width: 100%;
  max-height: 100vh;
  position: relative;
}
.sidebar-layout__resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  width: 1px;
  background: var(--j-color-ui-100);
  cursor: col-resize;
  height: 100%;
  transition: all 0.2s ease;
}
.sidebar-layout__resize-handle:hover,
.sidebar-layout--is-dragging .sidebar-layout__resize-handle {
  width: 3px;
  background: var(--j-color-primary-400);
}
</style>
