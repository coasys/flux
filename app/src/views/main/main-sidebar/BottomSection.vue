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
        <Avatar
          class="left-nav__profile-icon"
          :did="agent?.did"
          :url="profile?.profileThumbnailPicture"
          @click="() => navigate()"
        ></Avatar>
      </j-tooltip>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions, mapState } from "pinia";
import Avatar from "@/components/avatar/Avatar.vue";
import { useMe } from "utils/vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

export default defineComponent({
  components: {
    Avatar,
  },
  async setup() {
    const appStore = useAppStore();
    const userStore = useUserStore();

    const client = await getAd4mClient();

    const { profile, agent } = useMe(client.agent);

    return {
      agent,
      profile,
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
