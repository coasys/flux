<template>
  <j-modal size="sm" :open="modalStore.showInviteCode" @toggle="(e: any) => toggleModal(e.target.open)">
    <j-box p="800">
      <j-box pb="500">
        <j-text variant="heading">Invite people</j-text>
        <j-text variant="body">Copy and send this code to the people you want to join your community</j-text>
      </j-box>

      <j-input @click="(e: any) => e.target.select()" size="lg" readonly :value="perspective.sharedUrl || ''">
        <j-button @click.stop="getInviteCode" variant="ghost" slot="end">
          <j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'" />
        </j-button>
      </j-input>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useAppStore, useModalStore } from '@/stores';
import { ref } from 'vue';

const appStore = useAppStore();
const modalStore = useModalStore();

const { perspective } = useCommunityService();

const hasCopied = ref(false);

async function getInviteCode() {
  const url = perspective.sharedUrl;
  if (!url) return appStore.showDangerToast({ message: 'No invite code available yet.' });

  const text = `Hey! Here is an invite code to join my private community on Flux: ${url}`;

  try {
    await navigator.clipboard.writeText(text);
    hasCopied.value = true;
    appStore.showSuccessToast({ message: 'Your custom invite code is copied to your clipboard!' });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    appStore.showDangerToast({ message: 'Failed to copy invite code. Please try again.' });
  }
}

function toggleModal(open: boolean): void {
  modalStore.showInviteCode = open;
  if (!open) hasCopied.value = false;
}
</script>

<style scoped></style>
