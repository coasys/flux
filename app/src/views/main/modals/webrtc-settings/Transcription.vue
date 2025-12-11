<template>
  <j-flex direction="column" gap="500">
    <h3>Transcription settings</h3>
    <j-flex a="center" gap="400">
      <j-text nomargin>Transcribe audio</j-text>
      <j-toggle :checked="transcriptionEnabled" @change="aiStore.toggleTranscriptionEnabled">
        {{ transcriptionEnabled ? 'ON' : 'OFF' }}
      </j-toggle>
    </j-flex>
    <j-flex a="center" gap="400" wrap>
      <j-text nomargin :style="{ flexShrink: 0 }"> AI model </j-text>
      <div :style="{ height: '42px', zIndex: 10 }">
        <j-menu>
          <j-menu-group collapsible :title="transcriptionModel">
            <j-menu-item
              v-for="model in transcriptionModels"
              :key="model"
              :selected="model === transcriptionModel"
              @click="() => aiStore.setTranscriptionModel(model)"
            >
              {{ model }}
            </j-menu-item>
          </j-menu-group>
        </j-menu>
      </div>
    </j-flex>
    <j-flex a="center" gap="400" wrap>
      <j-text nomargin>Seconds of silence between preview chunks</j-text>
      <j-flex a="center" gap="400">
        <j-button size="xs" square @click="incrementPreviewTimeout(-0.2)">
          <j-icon name="caret-left-fill" />
        </j-button>
        <j-text nomargin color="color-white">
          {{ transcriptionPreviewTimeout }}
        </j-text>
        <j-button size="xs" square @click="incrementPreviewTimeout(0.2)">
          <j-icon name="caret-right-fill" />
        </j-button>
      </j-flex>
    </j-flex>
    <j-flex a="center" gap="400" wrap>
      <j-text nomargin>Seconds of silence before message created</j-text>
      <j-flex a="center" gap="400">
        <j-button size="xs" square @click="incrementMessageTimeout(-1)">
          <j-icon name="caret-left-fill" />
        </j-button>
        <j-text nomargin color="color-white">
          {{ transcriptionMessageTimeout }}
        </j-text>
        <j-button size="xs" square @click="incrementMessageTimeout(1)">
          <j-icon name="caret-right-fill" />
        </j-button>
      </j-flex>
    </j-flex>
  </j-flex>
</template>

<script setup lang="ts">
import { transcriptionModels, useAiStore } from '@/stores';
import { storeToRefs } from 'pinia';

const aiStore = useAiStore();

const { transcriptionEnabled, transcriptionModel, transcriptionPreviewTimeout, transcriptionMessageTimeout } =
  storeToRefs(aiStore);

function incrementPreviewTimeout(value: number) {
  const newValue = parseFloat((transcriptionPreviewTimeout.value + value).toFixed(1));
  if (newValue >= 0.2 && newValue <= 3) aiStore.setTranscriptionPreviewTimeout(newValue);
}

function incrementMessageTimeout(value: number) {
  const newValue = parseFloat(`${transcriptionMessageTimeout.value + value}`);
  if (newValue >= 1 && newValue <= 10) aiStore.setTranscriptionMessageTimeout(newValue);
}
</script>
