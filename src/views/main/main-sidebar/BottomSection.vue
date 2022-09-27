<template>
  <div class="left-nav__bottom-section">
    <j-tooltip id="settings" title="Settings">
      <j-button size="lg" circle square variant="ghost" @click="goToSettings">
        <j-icon size="md" name="gear"></j-icon>
      </j-button>
    </j-tooltip>
    <router-link
      :to="{
        name: 'home',
      }"
      custom
      v-slot="{ navigate }"
    >
      <j-tooltip title="Profile">
        <j-avatar
          class="left-nav__profile-icon"
          size="lg"
          :hash="agent.did"
          :src="userProfileImage"
          @click="() => navigate()"
        ></j-avatar>
      </j-tooltip>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from "vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions, mapState } from "pinia";
import { getImage } from "@/utils/profileHelpers";

export default defineComponent({
  setup() {
    const appStore = useAppStore();
    const userStore = useUserStore();

    return {
      appStore,
      userStore,
    };
  },
  data() {
    return {
      userProfileImage: "",
      showBottomOptions: false,
    };
  },
  watch: {
    userProfile: {
      async handler() {
        if (this.userStore.profile?.profilePicture) {
          this.userProfileImage = await getImage(
            this.userStore.profile?.profilePicture
          );
        } else {
          this.userProfileImage = "";
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapState(useUserStore, ["profile", "agent"]),
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
