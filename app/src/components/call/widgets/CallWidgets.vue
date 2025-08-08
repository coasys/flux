<template>
  <div class="call-sidebar" :style="{ width: `calc(${communitySidebarWidth}px + 100px)` }">
    <j-flex direction="column" gap="500">
      <ProcessingWidget v-if="processingState" />
      <TranscriberWidget v-if="inCall && transcriptionEnabled" />
      <ProfileWidget :callRouteData="callRouteData" />
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { useAiStore, useUiStore, useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";
import ProcessingWidget from "./ProcessingWidget.vue";
import ProfileWidget from "./ProfileWidget.vue";
import TranscriberWidget from "./TranscriberWidget.vue";

defineProps<{
  callRouteData: {
    communityName: string;
    channelName: string;
    conversationName: string;
  };
}>();

const aiStore = useAiStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { communitySidebarWidth } = storeToRefs(uiStore);
const { transcriptionEnabled, processingState } = storeToRefs(aiStore);
const { inCall } = storeToRefs(webrtcStore);
</script>

<style scoped lang="scss">
.call-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex-shrink: 0;
  height: 100%;
  max-width: calc(33vw + 100px);
  min-width: 300px;
  padding: var(--j-space-500);
}
</style>
