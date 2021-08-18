<template>
  <header class="channel-header">
    <j-icon size="sm" name="hash" />
    <j-text nomargin weight="500" size="500">
      {{ channel.neighbourhood.name }}</j-text
    >
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["channel", "community"],
});
</script>

<style scoped>
.channel-header {
  position: sticky;
  top: 0;
  min-height: 74px;
  height: 74px;
  max-height: 74px;
  padding: var(--j-space-400) var(--j-space-500);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--app-channel-border-color);
  background: var(--app-channel-header-bg-color);
  z-index: 1;
}
</style>
