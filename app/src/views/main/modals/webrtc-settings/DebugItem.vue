<template>
  <div class="item">
    <div class="details">
      <span>{{ peer.agentState.username || peer.did || 'Unknown user' }}</span>
      <span>({{ peer.peer.connection?.peerConnection?.iceConnectionState || 'Not connected' }})</span>
    </div>
    <div>
      <j-button variant="transparent" size="xs" @click="sendSignal(peer.did)"> Send signal </j-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ peer: any }>();

function sendSignal(did: string) {
  console.log(`Sending signal to ${did}`);
}
</script>

<style scoped>
.item {
  display: flex;
  gap: var(--j-space-400);
  justify-content: space-between;
  align-items: center;
}

.details {
  display: flex;
  gap: var(--j-space-400);
  align-items: center;
}

.username {
  font-size: bold;
}
</style>
