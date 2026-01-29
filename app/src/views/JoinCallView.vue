<template>
  <div class="join-call-view">
    <j-flex direction="column" a="center" j="center" gap="500" style="height: 100vh">
      <j-flex direction="column" a="center" gap="400">
        <j-icon name="telephone" size="xl" color="primary-500" />
        
        <template v-if="loading">
          <j-spinner size="lg" />
          <j-text size="600" nomargin>{{ loadingMessage }}</j-text>
        </template>

        <template v-else-if="error">
          <j-text size="600" nomargin color="danger-600">{{ error }}</j-text>
          <j-button @click="router.push('/home')" variant="primary">Go to Home</j-button>
        </template>
      </j-flex>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { useAppStore, useUiStore } from '@/stores';
import { parseCallInviteUrl } from '@/utils/callInviteUrl';
import { joinCommunity } from '@coasys/flux-api';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUiStore();

const loading = ref(true);
const loadingMessage = ref('Processing call invite...');
const error = ref('');

onMounted(async () => {
  try {
    // Parse the URL parameters
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const parsed = parseCallInviteUrl(params);

    if (!parsed) {
      error.value = 'Invalid call invite link';
      loading.value = false;
      return;
    }

    const { neighbourhoodUrl, channelId } = parsed;

    // Check if already a member of this community
    loadingMessage.value = 'Checking community membership...';
    const perspectives = await appStore.ad4mClient.perspective.all();
    const existingCommunity = perspectives.find((p) => p.sharedUrl === neighbourhoodUrl);

    let communityId: string;

    if (existingCommunity) {
      // Already a member
      communityId = existingCommunity.uuid;
    } else {
      // Need to join first
      loadingMessage.value = 'Joining community...';
      try {
        const community = await joinCommunity({
          joiningLink: neighbourhoodUrl,
          client: appStore.ad4mClient,
        });
        communityId = community.uuid;
        appStore.showSuccessToast({ message: 'Successfully joined community!' });
      } catch (joinError) {
        console.error('Failed to join community:', joinError);
        error.value = 'Failed to join community. The invite link may be invalid or expired.';
        loading.value = false;
        return;
      }
    }

    // Navigate to the channel
    loadingMessage.value = 'Opening call...';
    await router.push({
      name: 'channel',
      params: { communityId, channelId },
    });

    // Open the call window (but don't auto-join)
    uiStore.setCallWindowOpen(true);

    loading.value = false;
  } catch (e) {
    console.error('Error processing call invite:', e);
    error.value = 'An unexpected error occurred. Please try again.';
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.join-call-view {
  width: 100%;
  height: 100vh;
  background-color: var(--j-color-ui-50);
}
</style>
