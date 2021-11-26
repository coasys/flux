<template>
  <div class="left-nav__bottom-section">
    <j-tooltip id="settings" title="Settings">
      <j-button
        size="xl"
        circle
        square
        variant="ghost"
        @click="goToSettings"
      >
        <j-icon size="lg" name="gear"></j-icon>
      </j-button>
    </j-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from "vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions } from "pinia";

export default defineComponent({
  setup() {
    const appStore = useAppStore();
    const userStore = useUserStore();

    onBeforeMount(() => {
      window.api.receive("getCleanState", (data: string) => {
        localStorage.clear();

        window.api.send("quitApp");
      });
    });

    return {
      appStore,
      userStore,
    };
  },
  data() {
    return {
      showBottomOptions: false,
    };
  },
  methods: {
    ...mapActions(useAppStore, ["setShowEditProfile", "setShowSettings"]),
    logOut(): void {
      this.$router.replace({ name: "login" });
    },
    goToSettings() {
      this.$router.push({ name: "settings" });
      this.showBottomOptions = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.left-nav__bottom-section {
  width: 100%;
  border-top: 1px solid var(--app-main-sidebar-border-color);
  padding: 2rem 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
}

.left-nav__profile-icon {
  cursor: pointer;
}
</style>
