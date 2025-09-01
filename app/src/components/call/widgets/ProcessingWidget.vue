<template>
  <j-flex v-if="processingState" direction="column" gap="300" class="widget">
    <j-flex a="center" gap="300">
      <j-icon name="robot" size="lg" color="ui-700" />
      <j-text nomargin>
        {{ processingState.itemIds?.length || 0 }} items being processed
        {{ defaultLLM!.local ? "localy" : "remotely" }}
        {{
          processingQueue.length > 1
            ? `(${processingQueue.length - 1} task${processingQueue.length === 2 ? "" : "s"} queued)`
            : ""
        }}
      </j-text>
      <j-spinner size="xs" />
    </j-flex>

    <j-text size="400">
      <b>{{ processingState.communityName }}</b>
      <template v-if="processingState.channelName"> / #{{ processingState.channelName }}</template>
      <template v-if="processingState.conversationName"> / {{ processingState.conversationName }}</template>
    </j-text>

    <ProgressBar :steps="llmProcessingSteps" :current-step="processingState?.step || 0" />
  </j-flex>
</template>

<script setup lang="ts">
import ProgressBar from "@/components/progress-bar/ProgressBar.vue";
import { llmProcessingSteps, useAiStore } from "@/stores";
import { storeToRefs } from "pinia";

const aiStore = useAiStore();
const { processingState, defaultLLM, processingQueue } = storeToRefs(aiStore);
</script>

<style scoped lang="scss">
.widget {
  pointer-events: auto;
  gap: var(--j-space-400);
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  padding: var(--j-space-400);
  background-color: var(--j-color-ui-100);
}
</style>
