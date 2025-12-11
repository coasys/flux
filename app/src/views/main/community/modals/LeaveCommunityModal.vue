<template>
  <j-modal
    v-if="modalStore.showLeaveCommunity"
    size="sm"
    :open="modalStore.showLeaveCommunity"
    @toggle="(e: any) => (modalStore.showLeaveCommunity = e.target.open)"
  >
    <j-box p="800">
      <j-box pb="900">
        <j-text variant="heading"> Leave community '{{ community.name || 'Unknown' }}' </j-text>
        <j-text nomargin> Are you sure you want to leave this community? </j-text>
      </j-box>

      <j-flex j="end" gap="300">
        <j-button @click="modalStore.showLeaveCommunity = false" variant="link"> Cancel </j-button>
        <j-button variant="primary" :loading="leaving" @click="leaveCommunity"> Leave community </j-button>
      </j-flex>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useRouteParams } from '@/composables/useRouteParams';
import { useAppStore, useModalStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();

const { ad4mClient } = storeToRefs(appStore);
const { community } = useCommunityService();
const { communityId } = useRouteParams();

const leaving = ref(false);

async function leaveCommunity() {
  if (!communityId.value) return appStore.showDangerToast({ message: 'Invalid community id.' });
  leaving.value = true;
  try {
    await router.push({ name: 'home' });
    await ad4mClient.value.perspective.remove(communityId.value);
    modalStore.showLeaveCommunity = false;
    appStore.showSuccessToast({ message: 'You left the community.' });
  } catch (e: any) {
    appStore.showDangerToast({ message: 'Failed to leave community. Please try again.' });
  } finally {
    leaving.value = false;
  }
}
</script>

<style scoped></style>
