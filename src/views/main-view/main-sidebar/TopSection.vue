<template>
  <div class="left-nav__top-section">
    <router-link
      :to="{
        name: 'home',
      }"
      custom
      v-slot="{ navigate, isActive }"
    >
      <j-tooltip title="Home">
        <j-avatar
          :selected="isActive"
          @click="() => navigate()"
          icon="house"
          size="xl"
        >
        </j-avatar>
      </j-tooltip>
    </router-link>
    <j-tooltip title="Create a community">
      <j-button
        @click="() => $store.commit('setShowCreateCommunity', true)"
        square
        circle
        size="xl"
      >
        <j-icon size="lg" name="plus"></j-icon>
      </j-button>
    </j-tooltip>
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
  padding: var(--j-space-500) 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
}

.left-nav__profile-icon {
  cursor: pointer;
}

j-avatar {
  cursor: pointer;
}
</style>
