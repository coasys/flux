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
import { useCommunityService } from "@/composables/useCommunityService";
import { useAppStore, useModalStore } from "@/stores";
import { ref } from "vue";

const appStore = useAppStore();
const modalStore = useModalStore();

const { perspective } = useCommunityService();

const hasCopied = ref(false);

function getInviteCode() {
  // Get the invite code to join community and copy to clipboard
  const el = document.createElement("textarea");
  el.value = `Hey! Here is an invite code to join my private community on Flux: ${perspective.sharedUrl}`;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  hasCopied.value = true;

  appStore.showSuccessToast({ message: "Your custom invite code is copied to your clipboard!" });
}

function toggleModal(open: boolean): void {
  modalStore.showInviteCode = open;
  if (!open) hasCopied.value = false;
}
</script>

<style scoped></style>
