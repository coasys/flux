<template>
  <div class="left-nav__bottom-section">
    <j-tooltip id="settings" title="Settings">
      <j-button size="lg" circle square variant="ghost" @click="goToSettings">
        <j-icon size="md" name="gear" />
      </j-button>
    </j-tooltip>

    <RouterLink :to="{ name: 'home' }" v-slot="{ navigate }" custom>
      <j-tooltip title="Profile">
        <j-avatar
          class="left-nav__profile-icon"
          :hash="profile?.did"
          :src="profile?.profileThumbnailPicture"
          @click="() => navigate()"
        />
      </j-tooltip>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useAppStore, useUiStore } from '@/stores';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { Profile } from '@coasys/flux-types';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const uiStore = useUiStore();
const { me } = storeToRefs(appStore);
const { isMobile } = storeToRefs(uiStore);
const profile = ref<Profile | null>(null);
const showBottomOptions = ref(false);

// TODO: Implement logout logic
function logOut(): void {
  // router.replace({ name: "login" });
}

function goToSettings(): void {
  // On mobile the call window is a fullscreen overlay (z-index above the
  // settings route), so minimise it first — otherwise settings opens behind
  // the call. The call itself stays alive (inCall is untouched).
  if (isMobile.value) uiStore.setCallWindowOpen(false);
  router.push({ name: 'settings' });
  showBottomOptions.value = false;
}

onMounted(async () => {
  profile.value = await getCachedAgentProfile(me.value.did, appStore.ad4mClient);
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
