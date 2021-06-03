<template>
  <div class="mainView__topBar">
    <j-flex gap="300" a="center">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
    </j-flex>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["channel", "community"],
});
</script>

<style lang="scss">
.mainView__topBar {
  z-index: 2000;
  height: 60px;
  background-color: var(--j-color-white);
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-50);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  left: 0;
}
</style>
