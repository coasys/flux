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
import { useModalStore } from "@/stores";
import { joinCommunity } from "@coasys/flux-api";
import { ref } from "vue";

const props = defineProps({ joiningLink: String });

const modalStore = useModalStore();

const isJoiningCommunity = ref(false);

function handleJoinCommunity() {
  isJoiningCommunity.value = true;

  joinCommunity({ joiningLink: props.joiningLink || "" })
    .then(() => (modalStore.showJoinCommunity = false))
    .finally(() => (isJoiningCommunity.value = false));
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
