<template>
  <div class="join-call-view">
    <!-- Demo mode: render nothing while auto-join runs silently; surface on failure -->
    <j-box v-if="!isDemoMode || error" p="800">
      <j-flex direction="column" a="center" gap="600">
        <template v-if="!isDemoMode">
          <j-flex gap="400" a="center">
            <j-icon name="people" size="lg" color="primary-500" />
            <j-text nomargin variant="heading-sm">Join Community</j-text>
          </j-flex>

          <j-flex direction="column" a="center" gap="200">
            <j-text color="ui-600" nomargin>You need to join this community to continue.</j-text>
            <j-text color="ui-600" nomargin>Would you like to join now?</j-text>
          </j-flex>

          <j-flex gap="400">
            <j-button :disabled="isJoining" size="lg" full @click="router.push('/home')"> Cancel </j-button>
            <j-button :loading="isJoining" :disabled="isJoining" variant="primary" size="lg" full @click="handleJoin">
              Join Community
            </j-button>
          </j-flex>
        </template>

        <j-text v-if="error" variant="body" color="danger-600">
          {{ error }}
        </j-text>
      </j-flex>
    </j-box>
  </div>
</template>

<script setup lang="ts">
import { useAppStore, useUiStore } from '@/stores';
import { restoreNeighbourhoodPrefix } from '@/utils/routeUtils';
import { joinCommunity } from '@coasys/flux-api';
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUiStore();

const isDemoMode = !!new URLSearchParams(window.location.search).get('demoHost')?.trim();
const isJoining = ref(false);
const error = ref('');

// In demo mode, skip the confirmation UI and join immediately on mount
onMounted(async () => {
  if (isDemoMode) {
    await handleJoin();
  }
});

async function handleJoin() {
  isJoining.value = true;
  error.value = '';

  try {
    const communityId = route.params.communityId as string;
    const redirectPath = route.query.redirect as string;

    // Join the community
    await joinCommunity({
      joiningLink: restoreNeighbourhoodPrefix(communityId),
      client: appStore.ad4mClient,
    });

    // Refresh communities list
    await appStore.getMyCommunities();

    // Show success message
    appStore.showSuccessToast({ message: 'Successfully joined community!' });

    // Redirect to the original route if available
    if (redirectPath) {
      router.push(redirectPath);
      // Open call window if redirecting to a conversation incase it takes longer than the delay in Header.vue to detect agents in call
      if (redirectPath.includes('/conversation')) uiStore.setCallWindowOpen(true);
    }
  } catch (err) {
    console.error('Failed to join community:', err);
    error.value = 'Failed to join community. The invite link may be invalid or expired.';
  } finally {
    isJoining.value = false;
  }
}
</script>

<style scoped lang="scss">
.join-call-view {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: var(--j-color-ui-50);
}
</style>
