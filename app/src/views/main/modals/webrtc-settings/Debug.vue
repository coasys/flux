<template>
  <div>
    <h3>Debug</h3>
    <h4>Connections:</h4>
    <div v-if="!inCall">Not yet joined</div>
    <div v-if="inCall && peers.length < 1">No connections</div>
    <ul class="list">
      <li v-for="peer in peers" :key="peer.did">
        <DebugItem :peer="peer" />
      </li>
    </ul>
    <div class="footer">
      <!-- <j-button variant="secondary" size="xs" @click="uiStore.toggleShowDebug(true)"> Full debugger </j-button>
      <j-button variant="secondary" size="xs" @click="webRTC.onSendTestBroadcast" :disabled="!webRTC.hasJoined">
        Send broadcast
      </j-button>
      <j-button variant="secondary" size="xs" @click="webRTC.onGetStats"> Log RTC stats </j-button>
      <j-button variant="secondary" size="xs" @click="logState"> Log state </j-button> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebrtcStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import DebugItem from './DebugItem.vue';

const webrtcStore = useWebrtcStore();
const { inCall, agentsInCall, peerConnections } = storeToRefs(webrtcStore);

const peers = computed(() =>
  Array.from(peerConnections.value.values()).map((peer) => {
    console.log('peer', peer);
    const agentState = agentsInCall.value.find((agent) => agent.did === peer.did);
    return { ...peer, agentState };
  }),
);
</script>

<style scoped>
.wrapper {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 50%;
  left: 0;
  padding: 0;
}

.inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--j-font-family);
  background-color: #000000c4;
  padding: var(--j-space-400);
  overflow-x: hidden;
  color: white;

  animation: appear 0.3s ease both;
}

.list {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--j-space-400);
  padding: 0;
  list-style-type: none;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--j-space-400);
}
</style>
