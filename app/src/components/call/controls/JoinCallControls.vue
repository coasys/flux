<template>
  <div class="join-call-controls">
    <j-toggle
      :checked="mediaSettings.videoEnabled"
      :disabled="!mediaPermissions.microphone.granted"
      @change="mediaDeviceStore.toggleVideo"
    >
      Join with camera!
    </j-toggle>
    <j-button
      variant="primary"
      size="lg"
      :disabled="!mediaPermissions.microphone.granted"
      :loading="joiningCall"
      @click="webrtcStore.joinRoom"
    >
      Join room!
    </j-button>
  </div>
</template>

<script setup lang="ts">
import { useMediaDevicesStore, useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";

const mediaDeviceStore = useMediaDevicesStore();
const webrtcStore = useWebrtcStore();

const { mediaSettings, mediaPermissions } = storeToRefs(mediaDeviceStore);
const { joiningCall } = storeToRefs(webrtcStore);
</script>

<style scoped lang="scss">
.join-call-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--j-space-400);
}
</style>
