<template>
  <j-modal
    size="sm"
    :open="modalStore.showJoinCommunity"
    @toggle="(e: any) => (modalStore.showJoinCommunity = e.target.open)"
  >
    <j-box p="800">
      <j-flex direction="column" a="center" gap="600">
        <j-flex gap="400" a="center">
          <j-icon name="people" size="lg" color="primary-500" />
          <j-text nomargin variant="heading-sm">Join Community</j-text>
        </j-flex>

        <j-flex direction="column" a="center" gap="200">
            <j-text color="ui-600" nomargin>You need to join this community to continue.</j-text>
            <j-text color="ui-600" nomargin>Would you like to join now?</j-text>
        </j-flex>

        <j-flex gap="400">
          <j-button
            :disabled="isJoining"
            size="lg"
            full
            @click="handleCancel"
          >
            Cancel
          </j-button>
          <j-button
            :loading="isJoining"
            :disabled="isJoining"
            variant="primary"
            size="lg"
            full
            @click="handleJoin"
          >
            Join Community
          </j-button>
        </j-flex>

        <j-text v-if="error" variant="body" color="danger-600">
          {{ error }}
        </j-text>
      </j-flex>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useAppStore, useModalStore } from '@/stores';
import { joinCommunity } from '@coasys/flux-api';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();

const isJoining = ref(false);
const error = ref('');

async function handleJoin() {
  if (isJoining.value) return;
  isJoining.value = true;
  error.value = '';

  try {
    const pendingRoute = (modalStore as any).pendingRoute;
    const neighbourhoodUrl = (modalStore as any).pendingNeighbourhoodUrl;

    if (!neighbourhoodUrl) {
      error.value = 'Invalid community link';
      return;
    }

    // Join the community
    await joinCommunity({ 
      joiningLink: neighbourhoodUrl, 
      client: appStore.ad4mClient 
    });

    // Refresh communities list
    await appStore.getMyCommunities();
    
    appStore.showSuccessToast({ message: 'Successfully joined community!' });

    // Close modal and navigate
    modalStore.showJoinCommunity = false;
    (modalStore as any).pendingRoute = null;
    (modalStore as any).pendingNeighbourhoodUrl = null;
    
    if (pendingRoute) {
      router.push(pendingRoute);
    }
  } catch (err) {
    console.error('Failed to join community:', err);
    error.value = 'Failed to join community. The invite link may be invalid or expired.';
  } finally {
    isJoining.value = false;
  }
}

function handleCancel() {
  modalStore.showJoinCommunity = false;
  (modalStore as any).pendingRoute = null;
  (modalStore as any).pendingNeighbourhoodUrl = null;
  router.push('/home');
}
</script>
