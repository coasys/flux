<template>
  <div>
    <h3>Voice & Video settings</h3>
    <j-box :pt="300">
      <j-flex j="end" a="center" gap="200" direction="row">
        <Select
          name="video-device"
          label="Video input device"
          placeholder="Select device"
          :selected="activeCameraId || ''"
          :options="videoDeviceOptions"
          @change="(e: any) => mediaDevicesStore.switchCamera(e.target.value)"
        />

        <!-- <j-box v-if="!webRTC.videoPermissionGranted" :pt="600">
          <j-button @click="() => webRTC.onToggleCamera(true)" size="sm"> Allow permission </j-button>
        </j-box> -->
      </j-flex>
    </j-box>

    <j-box :pt="500">
      <Select
        name="audio-device"
        label="Audio input device"
        placeholder="Select device"
        :selected="activeMicrophoneId || ''"
        :options="audioDeviceOptions"
        @change="(e: any) => mediaDevicesStore.switchMicrophone(e.target.value)"
      />
    </j-box>
  </div>
</template>

<script setup lang="ts">
import { useMediaDevicesStore } from "@/stores/mediaDevicesStore";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import Select from "./Select.vue";

const mediaDevicesStore = useMediaDevicesStore();

const { cameras, microphones, activeCameraId, activeMicrophoneId } = storeToRefs(mediaDevicesStore);

const videoDeviceOptions = computed(() => cameras.value.map((v) => ({ text: v.label, value: v.deviceId })));
const audioDeviceOptions = computed(() => microphones.value.map((v) => ({ text: v.label, value: v.deviceId })));
</script>
