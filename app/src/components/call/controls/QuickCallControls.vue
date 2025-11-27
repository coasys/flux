<template>
  <j-flex a="center" gap="500">
    <j-tooltip placement="top" :title="`${transcriptionEnabled ? 'Disable' : 'Enable'} transcription`">
      <TranscriptionIcon
        :enabled="transcriptionEnabled"
        color="ui-500"
        @click="aiStore.toggleTranscriptionEnabled"
        style="cursor: pointer"
      />
    </j-tooltip>

    <j-tooltip placement="top" :title="`${mediaSettings.audioEnabled ? 'Disable' : 'Enable'} microphone`">
      <j-icon
        :name="`mic${mediaSettings.audioEnabled ? '' : '-mute'}`"
        color="ui-500"
        @click="mediaDeviceStore.toggleAudio"
      />
    </j-tooltip>

    <j-tooltip placement="top" :title="`${mediaSettings.videoEnabled ? 'Disable' : 'Enable'} camera`">
      <j-icon
        :name="`camera-video${mediaSettings.videoEnabled ? '' : '-off'}`"
        color="ui-500"
        @click="mediaDeviceStore.toggleVideo"
      />
    </j-tooltip>

    <j-tooltip v-if="mediaSettings.screenShareEnabled" placement="top" title="Disable screen share">
      <j-icon name="display" color="ui-500" @click="mediaDeviceStore.toggleScreenShare" />
    </j-tooltip>

    <j-tooltip placement="top" title="Leave call">
      <j-icon name="telephone-x" color="danger-500" @click="webrtcStore.leaveRoom" />
    </j-tooltip>
  </j-flex>
</template>

<script setup lang="ts">
import TranscriptionIcon from '@/components/icons/TranscriptionIcon.vue';
import { useAiStore, useMediaDevicesStore, useWebrtcStore } from '@/stores';
import { storeToRefs } from 'pinia';

const aiStore = useAiStore();
const mediaDeviceStore = useMediaDevicesStore();
const webrtcStore = useWebrtcStore();

const { transcriptionEnabled } = storeToRefs(aiStore);
const { mediaSettings } = storeToRefs(mediaDeviceStore);
</script>
