<template>
  <div class="voice-recorder">
    <j-box v-if="isRecording || isTranscribing || finalText || previewText" py="300" class="voice-preview-card">
      <j-flex direction="column" gap="300">
        <j-flex a="center" gap="300" j="between">
          <j-flex a="center" gap="300">
            <span v-if="isRecording" class="recording-led" />
            <j-text nomargin color="primary-500" size="300">
              {{ isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : '' }}
            </j-text>
          </j-flex>
          <j-button
            @click="cancelRecording"
            circle
            size="xs"
            variant="ghost"
            title="Cancel"
          >
            <j-icon size="xs" name="x" />
          </j-button>
        </j-flex>
        <j-text v-if="finalText || previewText" nomargin color="ui-800" size="400">
          {{ finalText }}
          <span
            v-if="previewText"
            :style="{ fontStyle: 'italic', color: 'var(--j-color-ui-400)' }"
          >
            {{ previewText }}
          </span>
        </j-text>
      </j-flex>
    </j-box>

    <j-button
      @click="toggleRecording"
      circle
      square
      size="sm"
      variant="primary"
      :disabled="isTranscribing"
    >
      <j-icon size="sm" :name="isRecording ? 'send' : 'mic'" />
    </j-button>
  </div>
</template>

<script setup lang="ts">
import { Ad4mClient } from '@coasys/ad4m';
import { Message } from '@coasys/flux-api';
import { feedUtterance } from '@coasys/flux-utils';
import { useAiStore } from '@/stores';
import { ref, onUnmounted } from 'vue';

const aiStore = useAiStore();

const props = defineProps<{
  client: Ad4mClient;
  perspective: any;
  source: string;
}>();

const isRecording = ref(false);
const isTranscribing = ref(false);
const previewText = ref('');
const finalText = ref('');
const transcriptTimestamp = ref<Date | null>(null);

// Audio capture refs (AudioWorklet approach)
let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let stream: MediaStream | null = null;
let transcriptionStreamId: string | null = null;
let fastTranscriptionStreamId: string | null = null;

function handleTranscriptionText(text: string) {
  finalText.value += text;
  previewText.value = '';
}

async function cleanup() {
  // Stop all tracks
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  
  // Disconnect and close audio context
  workletNode?.disconnect();
  workletNode = null;
  
  await audioContext?.close();
  audioContext = null;
  
  // Close transcription streams with error handling
  if (transcriptionStreamId) {
    try {
      await props.client.ai.closeTranscriptionStream(transcriptionStreamId);
    } catch (err) {
      console.error('Error closing transcription stream:', err);
    }
    transcriptionStreamId = null;
  }
  if (fastTranscriptionStreamId) {
    try {
      await props.client.ai.closeTranscriptionStream(fastTranscriptionStreamId);
    } catch (err) {
      console.error('Error closing fast transcription stream:', err);
    }
    fastTranscriptionStreamId = null;
  }
}

async function startRecording() {
  // Guard: prevent multiple concurrent recordings
  if (isRecording.value || audioContext) {
    console.warn('Recording already in progress');
    return;
  }

  try {
    finalText.value = '';
    previewText.value = '';
    transcriptTimestamp.value = new Date();
    
    // Get microphone access
    stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true, noiseSuppression: true } 
    });
    
    // Open transcription streams (final + preview)
    transcriptionStreamId = await props.client.ai.openTranscriptionStream(
      aiStore.whisperModelId,
      handleTranscriptionText,
      { startThreshold: 0.8 }
    );
    
    fastTranscriptionStreamId = await props.client.ai.openTranscriptionStream(
      aiStore.tinyWhisperModelId,
      (text: string) => { previewText.value = text; },
      {
        startThreshold: 0.5,
        startWindow: 80,
        endThreshold: 0.1,
        endWindow: 50,
        timeBeforeSpeech: 20,
      }
    );
    
    // Set up AudioContext and Worklet for raw PCM capture
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load the audio worklet processor
    await audioContext.audioWorklet.addModule('/audio-processor.js');
    
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    
    // Configure VAD thresholds on the worklet (more demanding = reject noise)
    workletNode.port.postMessage({
      speechOnsetThreshold: 0.04,
      silenceThreshold: 0.025,
      onsetHoldFrames: 6,
      minUtteranceSamples: 2400,
    });
    
    // Handle utterances from VAD worklet
    workletNode.port.onmessage = async (event) => {
      if (isRecording.value) {
        await feedUtterance(
          props.client,
          [fastTranscriptionStreamId, transcriptionStreamId],
          event.data
        );
      }
    };
    
    mediaStreamSource.connect(workletNode);
    workletNode.connect(audioContext.destination);
    
    isRecording.value = true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    finalText.value = '';
    previewText.value = '';
    transcriptTimestamp.value = null;
    await cleanup();
  }
}

async function stopRecording() {
  if (!isRecording.value) return;
  
  isRecording.value = false;
  isTranscribing.value = true;
  
  await cleanup();
  
  const text = finalText.value.trim();
  if (text) {
    try {
      const messageData: any = { body: text };
      if (transcriptTimestamp.value) {
        messageData.transcriptStartedAt = transcriptTimestamp.value.toISOString();
      }
      await Message.create(props.perspective, messageData, {
        parent: { id: props.source, predicate: 'ad4m://has_child' },
      });
    } catch (e) {
      console.error('Failed to save voice message:', e);
    }
  }
  
  finalText.value = '';
  previewText.value = '';
  transcriptTimestamp.value = null;
  isTranscribing.value = false;
}

async function cancelRecording() {
  if (!isRecording.value && !isTranscribing.value && !finalText.value && !previewText.value) return;
  
  isRecording.value = false;
  
  await cleanup();
  
  finalText.value = '';
  previewText.value = '';
  transcriptTimestamp.value = null;
  isTranscribing.value = false;
}

async function toggleRecording() {
  if (isRecording.value) {
    await stopRecording();
  } else {
    await startRecording();
  }
}

// Cleanup on unmount
onUnmounted(async () => {
  if (isRecording.value || audioContext) {
    await cleanup();
  }
});
</script>

<style scoped lang="scss">
.voice-recorder {
  position: fixed;
  bottom: 80px;
  right: var(--j-space-500);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--j-space-300);
}

.recording-led {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--j-color-danger-500);
  animation: pulse-led 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-led {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.voice-preview-card {
  background-color: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
  box-shadow: var(--j-shadow-lg);
  backdrop-filter: blur(4px);
  max-width: 400px;
  padding: var(--j-space-400);
}
</style>
