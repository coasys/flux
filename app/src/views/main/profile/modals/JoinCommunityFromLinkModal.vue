<template>
  <j-modal
    size="lg"
    :open="modalStore.showJoinCommunity"
    @toggle="(e: any) => (modalStore.showJoinCommunity = e.target.open)"
  >
    <j-box pt="1000" pb="800" px="700">
      <j-text variant="heading-sm">Join Community</j-text>
      <j-text variant="body">You are not part of this community, would you like to join this community?</j-text>
      <j-button
        :disabled="isJoiningCommunity || !joiningLink"
        :loading="isJoiningCommunity"
        @click="handleJoinCommunity"
        size="lg"
        full
        variant="primary"
      >
        Join Community
      </j-button>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useAppStore, useModalStore } from '@/stores';
import { joinCommunity } from '@coasys/flux-api';
import { ref } from 'vue';

const props = defineProps({ joiningLink: String });

const appStore = useAppStore();
const modalStore = useModalStore();

const isJoiningCommunity = ref(false);

async function handleJoinCommunity() {
  isJoiningCommunity.value = true;
  try {
    await joinCommunity({ joiningLink: (props.joiningLink || '').trim() });
    modalStore.showJoinCommunity = false;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    appStore.showDangerToast({ message });
  } finally {
    isJoiningCommunity.value = false;
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  height: 300px;
  margin: 0;
  padding: 20px;
}
</style>
