<template>
  <div class="left-nav__top-section">
    <router-link
      :to="{
        name: 'home',
      }"
      custom
      v-slot="{ navigate }"
    >
      <j-tooltip title="Home">
        <j-button
          @click="() => navigate()"
          square
          circle
          size="xl"
          variant="primary"
        >
          <j-icon name="house"></j-icon>
        </j-button>
      </j-tooltip>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "topsection",
});
</script>

<style lang="scss" scoped>
.left-nav__top-section {
  width: 100%;
  padding: var(--j-space-400) 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
}

.left-nav__profile-icon {
  cursor: pointer;
}
</style>
