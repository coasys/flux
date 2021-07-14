<template>
  <j-box pb="1000">
    <j-flex wrap gap="500" a="center" j="between">
      <j-text nomargin variant="heading-lg">My profile</j-text>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  computed: {
    communities() {
      return this.$store.state.communities;
    },
  },
});
</script>

<style scoped>
.community-items {
  display: grid;
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-border-color);
  grid-template-columns: 1fr;
}

.community-item {
  text-decoration: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--j-space-700);
  align-items: center;
  height: 100%;
  cursor: pointer;
  width: 100%;
  justify-content: space-between;
  padding: var(--j-space-500);
  border-bottom: 1px solid var(--j-border-color);
  transition: all 0.2s ease;
}

.community-item__content {
  flex: 1;
}

.community-item:hover {
  background: var(--j-color-ui-50);
}
</style>
