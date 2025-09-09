<template>
  <div class="resize-handle" @mousedown="$emit('start-resize', $event)" />
</template>

<script setup lang="ts">
defineEmits<{
  "start-resize": [event: MouseEvent];
}>();
</script>

<style scoped lang="scss">
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: var(--j-color-primary-500);
  cursor: col-resize;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}
</style>
