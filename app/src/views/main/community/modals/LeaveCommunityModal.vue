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
import { useAppStore, useModalStore } from '@/stores';
import { restoreNeighbourhoodPrefix } from '@/utils/routeUtils';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();
const { ad4mClient, myCommunities } = storeToRefs(appStore);

const leaving = ref(false);

const communityUrl = computed(() => modalStore.leaveCommunityUrl);
const community = computed(() => {
  if (!communityUrl.value) return { name: 'Unknown' };
  return myCommunities.value[communityUrl.value] || { name: 'Unknown' };
});

async function leaveCommunity() {
  const perspective = appStore.getPerspective(communityUrl.value || '');
  if (!perspective) return appStore.showDangerToast({ message: 'Invalid community id.' });
  leaving.value = true;
  try {
    if (restoreNeighbourhoodPrefix(route.params.communityId as string) === communityUrl.value)
      await router.push({ name: 'home' });
    await ad4mClient.value.perspective.remove(perspective.uuid);
    // Delete community from appStore myCommunities
    if (communityUrl.value && communityUrl.value in myCommunities.value) {
      const updated = { ...myCommunities.value };
      delete updated[communityUrl.value];
      myCommunities.value = updated;
    }
    modalStore.showLeaveCommunity = false;
    modalStore.leaveCommunityUrl = null;
    appStore.showSuccessToast({ message: 'You left the community.' });
  } catch (e: any) {
    console.log('Failed to leave community', e);
    appStore.showDangerToast({ message: 'Failed to leave community. Please try again.' });
  } finally {
    leaving.value = false;
  }
}
</script>

<style scoped></style>
