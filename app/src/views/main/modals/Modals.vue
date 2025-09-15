<template>
  <CreateCommunityModal />
  <DisclaimerModal />
  <WebrtcSettingsModal />
</template>

<script setup lang="ts">
import CreateCommunityModal from "@/views/main/modals/CreateCommunityModal.vue";
import WebrtcSettingsModal from "@/views/main/modals/webrtc-settings/WebrtcSettingsModal.vue";
import DisclaimerModal from "./DisclaimerModal.vue";
</script>
