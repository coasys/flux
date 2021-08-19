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
          square
          :src="require('@/assets/images/junto_app_icon.png')"
          circle
          size="xl"
          variant="primary"
        >
        </j-avatar>
      </j-tooltip>
    </router-link>
    <j-tooltip title="Create a community">
      <j-button
        @click="() => setShowCreateCommunity(true)"
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
import { useAppStore } from "@/store/app";
import { defineComponent } from "vue";
import { mapActions } from "pinia"

export default defineComponent({
  name: "topsection",
  methods: {
    ...mapActions(useAppStore, ["setShowCreateCommunity"]),
  }
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
