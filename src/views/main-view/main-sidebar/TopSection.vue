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
        <j-button
          :class="{ active: isActive }"
          @click="() => navigate()"
          size="xl"
          circle
          square
          variant="ghost"
        >
          <j-icon size="lg" name="grid-3x3-gap"></j-icon>
        </j-button>
      </j-tooltip>
    </router-link>
  </div>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { defineComponent } from "vue";
import { mapActions } from "pinia";

export default defineComponent({
  name: "topsection",
  methods: {
    ...mapActions(useAppStore, ["setShowCreateCommunity"]),
  },
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

j-button.active {
  display: inline-block;
  border-radius: 50%;
  --j-button-opacity: 1;
}

j-avatar {
  cursor: pointer;
}
</style>
