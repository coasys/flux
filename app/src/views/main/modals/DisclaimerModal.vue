<template>
  <j-modal
    v-if="modalStore.showDisclaimer"
    :open="modalStore.showDisclaimer"
    @toggle="(e: any) => (modalStore.showDisclaimer = e.target.open)"
  >
    <j-box p="800">
      <div v-if="modalStore.showDisclaimer">
        <j-box pb="500">
          <j-flex gap="400" a="center">
            <j-icon name="exclamation-diamond" size="lg" />
            <j-text nomargin variant="heading">Disclaimer</j-text>
          </j-flex>
        </j-box>

        <j-text variant="ingress">
          This is an early version of Flux. Don't use this for essential communication.
        </j-text>

        <ul>
          <li>You might lose your communities and chat messages</li>
          <li>Messages might not always be delivered reliably</li>
        </ul>
      </div>

      <j-box pt="500" pb="500" v-if="!hasJoinedTestingCommunity">
        <j-flex gap="400" a="center">
          <j-icon name="arrow-down-circle" size="lg" />
          <j-text nomargin variant="heading">Testing Community</j-text>
        </j-flex>

        <br />

        <j-text variant="ingress"> Join the Flux Alpha testing community. </j-text>

        <j-button :loading="isJoining" variant="primary" @click="joinTestingCommunity">
          Join Official Testing Community
        </j-button>
      </j-box>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useAppStore, useModalStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const appStore = useAppStore();
const modalStore = useModalStore();

const { hasJoinedTestingCommunity } = storeToRefs(appStore);

const isJoining = ref(false);

async function joinTestingCommunity() {
  try {
    isJoining.value = true;
    await appStore.joinTestingCommunity();
    modalStore.showDisclaimer = false;
  } catch (e) {
    console.log('Error joining testing community:', e);
  } finally {
    isJoining.value = false;
  }
}
</script>

<style scoped></style>
