<template>
  <div class="join-call-controls">
    <j-toggle :checked="mediaSettings.videoEnabled" :disabled="videoDisabled" @change="mediaDeviceStore.toggleVideo">
      Join with camera!
    </j-toggle>

    <j-button
      variant="primary"
      size="lg"
      :disabled="streamLoading"
      :loading="joiningCall"
      @click="webrtcStore.joinRoom"
    >
      Join room!
    </j-button>

    <div v-if="!streamLoading && audioUnavailable" class="audio-disabled-warning">
      <j-flex gap="300" a="center">
        <j-icon name="mic-mute" size="md" color="warning-500" />
        <j-text size="500" nomargin color="warning-500"> No microphone available </j-text>
      </j-flex>
      <j-text size="400" nomargin color="warning-500">
        You can still join and listen — enable a microphone in the browser
        if you'd like to speak.
      </j-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaDevicesStore, useWebrtcStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const mediaDeviceStore = useMediaDevicesStore();
const webrtcStore = useWebrtcStore();

const { mediaSettings, stream, streamLoading } = storeToRefs(mediaDeviceStore);
const { joiningCall } = storeToRefs(webrtcStore);

const videoDisabled = computed(() => {
  return !stream.value || streamLoading.value;
});

// Informational only — never gates the join button. Mic-less users can
// join as listeners; the warning lets them know they won't be heard until
// they grant mic access.
const audioUnavailable = computed(() => {
  if (!stream.value || typeof stream.value.getAudioTracks !== 'function') return true;
  return stream.value.getAudioTracks().length === 0;
});
</script>

<style scoped lang="scss">
.join-call-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--j-space-400);

  .audio-disabled-warning {
    margin-top: var(--j-space-400);
    background-color: var(--j-color-warning-50);
    border: 1px solid var(--j-color-warning-500);
    border-radius: var(--j-border-radius);
    padding: var(--j-space-300);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--j-space-300);
  }
}
</style>
