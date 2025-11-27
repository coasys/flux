<template>
  <div
    class="widgets"
    :class="{ mobile: isMobile, open: callWindowOpen }"
    :style="{ width: isMobile ? '100%' : `calc(${communitySidebarWidth}px + 100px)` }"
  >
    <j-flex direction="column" gap="500" ref="widgetsRef">
      <ProcessingWidget v-if="processingState" />
      <TranscriberWidget v-if="inCall && transcriptionEnabled" />
      <ProfileWidget :callRouteData="callRouteData" />
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { useAiStore, useUiStore, useWebrtcStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, onUnmounted, onUpdated, ref } from 'vue';
import ProcessingWidget from './ProcessingWidget.vue';
import ProfileWidget from './ProfileWidget.vue';
import TranscriberWidget from './TranscriberWidget.vue';

defineProps<{ callRouteData: { communityName: string; channelName: string; conversationName: string } }>();

const aiStore = useAiStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { communitySidebarWidth, isMobile, callWindowOpen } = storeToRefs(uiStore);
const { transcriptionEnabled, processingState } = storeToRefs(aiStore);
const { inCall } = storeToRefs(webrtcStore);

const widgetsRef = ref<HTMLElement>();

// Track widgets height
function updateWidgetsHeight() {
  nextTick(() => {
    if (!widgetsRef.value) return;
    const height = widgetsRef.value.getBoundingClientRect().height;
    uiStore.setCallWidgetsHeight(height);
  });
}

// Update height when mounted and when content changes
onMounted(updateWidgetsHeight);
onUpdated(updateWidgetsHeight);

// Use ResizeObserver for dynamic updates
onMounted(() => {
  if (widgetsRef.value && window.ResizeObserver) {
    const observer = new ResizeObserver(updateWidgetsHeight);
    observer.observe(widgetsRef.value);

    // Cleanup
    onUnmounted(() => observer.disconnect());
  }
});
</script>

<style scoped lang="scss">
.widgets {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex-shrink: 0;
  max-width: calc(33vw + 100px);
  min-width: 300px;
  padding: var(--j-space-500);
  z-index: 50;

  &.mobile {
    max-width: none;

    &.open {
      background-color: #1c1a1f;
    }
  }
}
</style>
