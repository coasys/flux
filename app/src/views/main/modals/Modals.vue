<template>
  <CreateCommunityModal />
  <DisclaimerModal />
  <WebrtcSettingsModal />
  <JoinCommunityModal />
</template>

<script setup lang="ts">
import CreateCommunityModal from '@/views/main/modals/CreateCommunityModal.vue';
import WebrtcSettingsModal from '@/views/main/modals/webrtc-settings/WebrtcSettingsModal.vue';
import DisclaimerModal from './DisclaimerModal.vue';
import JoinCommunityModal from './JoinCommunityModal.vue';
</script>
