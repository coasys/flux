<template>
  <div
    class="community-layout"
    :class="{ 'community-layout--closed': !showCommunitySidebar, 'community-layout--is-dragging': isDragging }"
  >
    <aside ref="sidebar" class="community-layout__drawer" :style="{ width: `${communitySidebarWidth}px` }">
      <span role="presentation" class="community-layout__resize-handle" @mousedown="startResize" />
      <slot name="sidebar"></slot>
    </aside>

    <main class="community-layout__main">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "@/store";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const ui = useUiStore();
const { showCommunitySidebar, communitySidebarWidth } = storeToRefs(ui);

const sidebar = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const startWidth = ref(0);

function startResize(e: any) {
  if (!sidebar.value) return;
  startWidth.value = sidebar.value.getBoundingClientRect().width;
  isDragging.value = true;
  startX.value = e.clientX;
  document.addEventListener("mousemove", doResize, false);
  document.addEventListener("mouseup", stopResize, false);
}

function doResize(e: any) {
  ui.setCommunitySidebarWidth(startWidth.value + (e.clientX - startX.value));
}

function stopResize() {
  isDragging.value = false;
  document.removeEventListener("mousemove", doResize);
  document.addEventListener("mouseup", stopResize, false);
}
</script>

<style>
.community-layout {
  height: 100%;
  display: flex;
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
}

.community-layout__toggle-button {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

.community-layout--is-dragging {
  user-select: none;
}

.community-layout__drawer {
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
  .community-layout .community-layout__drawer {
    height: 100%;
    width: 100% !important;
    max-width: 100%;
    background: var(--app-drawer-bg-color);
    overflow-y: auto;
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .community-layout--closed .community-layout__drawer {
    opacity: 0;
  }

  .community-layout .community-layout__main {
    width: 100%;
    height: 100%;
    overflow: hidden;
    transform: translate3d(100%, 0, 0);
    will-change: transform;
    z-index: 500;
    opacity: 0;
    transition: all 0.2s ease;
  }

  .community-layout--closed .community-layout__main {
    transform: translate3d(0, 0, 0);
    position: fixed;
    opacity: 1;
    left: 0;
    top: 0;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
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

.community-layout__main {
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
  flex: 1;
  background: var(--app-main-content-bg-color, var(--j-color-white));
}

.community-layout__resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  width: 3px;
  border-right: 1px solid var(--app-drawer-border-color, var(--j-border-color));
  background: transparent;
  cursor: col-resize;
  height: 100%;
  z-index: 100;
  transition: all 0.2s ease;
}

.community-layout__resize-handle:hover,
.community-layout--is-dragging .community-layout__resize-handle {
  border-right: 1px solid var(--j-color-focus);
  background: var(--j-color-focus);
}
</style>
