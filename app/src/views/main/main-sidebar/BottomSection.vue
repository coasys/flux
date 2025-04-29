<template>
  <div class="left-nav__bottom-section">
    <j-tooltip id="settings" title="Settings">
      <j-button size="lg" circle square variant="ghost" @click="goToSettings">
        <j-icon size="md" name="gear"></j-icon>
      </j-button>
    </j-tooltip>
    <router-link :to="{ name: 'home' }" v-slot="{ navigate }" custom>
      <j-tooltip title="Profile">
        <j-avatar
          class="left-nav__profile-icon"
          :hash="profile?.did"
          :src="profile?.profileThumbnailPicture"
          @click="() => navigate()"
        />
      </j-tooltip>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { getCachedAgentProfile } from "@coasys/flux-utils";
import { Profile } from "@coasys/flux-types";
import { useRouter } from "vue-router";

export default defineComponent({
  async setup() {
    const router = useRouter();
    const client = await getAd4mClient();
    const profile = ref<Profile | null>(null);
    const showBottomOptions = ref(false);

    const me = await client.agent.me();
    profile.value = await getCachedAgentProfile(me.did);

    function logOut(): void {
      router.replace({ name: "login" });
    }

    function goToSettings(): void {
      router.push({ name: "settings" });
      showBottomOptions.value = false;
    }

    return { profile, logOut, goToSettings };
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
