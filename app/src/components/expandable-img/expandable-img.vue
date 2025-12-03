<template>
  <div ref="expandableImageRef" class="expandable-image" :class="{ expanded }" @click="expanded = true">
    <div class="close-button" v-if="expanded" @click="closeViewer">
      <j-icon name="x" size="xl" />
    </div>
    <div v-else class="expand-button">
      <j-icon name="arrows-angle-expand" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

defineOptions({ inheritAttrs: false });

const expanded = ref(false);
const clonedEl = ref<HTMLElement | null>(null);
const closeButtonRef = ref<HTMLElement | null>(null);
const expandableImageRef = ref<HTMLElement>();

function closeViewer() {
  expanded.value = false;
}

// Watcher for expanded state
watch(expanded, async (isExpanded) => {
  await nextTick();

  if (isExpanded) {
    // Clone the current element
    clonedEl.value = expandableImageRef.value?.cloneNode(true) as HTMLElement;

    if (clonedEl.value) {
      // Find the close button in the cloned element
      closeButtonRef.value = clonedEl.value.querySelector('.close-button');

      // Add event listener to the close button
      if (closeButtonRef.value) closeButtonRef.value.addEventListener('click', closeViewer);

      // Append to body and set styles
      document.body.appendChild(clonedEl.value);
      document.body.style.overflow = 'hidden';

      // Trigger opacity transition
      setTimeout(() => {
        if (clonedEl.value) clonedEl.value.style.opacity = '1';
      }, 0);
    }
  } else {
    // Close the expanded view
    if (clonedEl.value) {
      clonedEl.value.style.opacity = '0';

      setTimeout(() => {
        if (clonedEl.value) {
          clonedEl.value.remove();
          clonedEl.value = null;
          closeButtonRef.value = null;
          document.body.style.overflow = 'auto';
        }
      }, 250);
    }
  }
});
</script>

<style scoped>
.expandable-image {
  position: relative;
  transition: 0.25s opacity;
}

:global(body > .expandable-image.expanded) {
  position: fixed;
  z-index: 999999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  opacity: 0;
  padding-bottom: 0 !important;
  cursor: default;
  background-origin: center;
  background-position: center;
  background-repeat: no-repeat;
}

:global(body > .expandable-image.expanded > img) {
  width: 100%;
  max-width: 1200px;
  max-height: 100%;
  object-fit: contain;
  margin: 0 auto;
}

:global(body > .expandable-image.expanded > .close-button) {
  display: block;
}

.close-button {
  position: fixed;
  top: 10px;
  right: 10px;
  display: none;
  cursor: pointer;
}

:global(svg path) {
  fill: #fff;
}

.expand-button {
  position: absolute;
  z-index: 999;
  right: 10px;
  top: 10px;
  padding: 0px;
  align-items: center;
  justify-content: center;
  padding: 3px;
  opacity: 0;
  transition: 0.2s opacity;
}

.expandable-image:hover .expand-button {
  opacity: 1;
}

.expand-button svg {
  width: 20px;
  height: 20px;
}

.expand-button path {
  fill: #fff;
}

.expandable-image img {
  width: 100%;
}
</style>
