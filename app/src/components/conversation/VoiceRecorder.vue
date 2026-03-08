<template>
  <div class="voice-recorder">
    <!-- Transcription card (similar to call transcriber) -->
    <j-box v-if="transcripts.length || previewText" mb="300" class="transcript-card">
      <j-flex direction="column" gap="300">
        <!-- Header with cancel button -->
        <j-flex j="between" a="center">
          <j-flex a="center" gap="300">
            <j-spinner v-if="isRecording || isTranscribing" size="xxs" />
            <j-text nomargin size="300" color="primary-500">
              {{ isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : '' }}
            </j-text>
          </j-flex>
          <j-button
            @click="cancelRecording"
            circle
            size="xs"
            variant="danger"
            title="Cancel"
          >
            <j-icon size="xs" name="x" />
          </j-button>
        </j-flex>
        <div
          v-for="transcript in transcripts"
          :key="transcript.id"
          class="transcript-item"
        >
          <j-flex direction="column" gap="200">
            <j-text nomargin size="400" color="ui-800">
              {{ transcript.text }}
              <span
                v-if="previewText && transcript.id === currentTranscriptId"
                :style="{ fontStyle: 'italic', color: 'var(--j-color-ui-400)' }"
              >
                {{ previewText }}
              </span>
            </j-text>
          </j-flex>
        </div>
      </j-flex>
    </j-box>

    <!-- Recording button -->
    <j-flex gap="300" a="center" class="recorder-controls">
      <j-button
        @click="toggleRecording"
        variant="primary"
        :disabled="isTranscribing"
        circle
        size="lg"
      >
        <j-icon :name="isRecording ? 'send' : 'mic-fill'" size="lg" />
      </j-button>
      <div class="recorder-status">
        <j-text v-if="isRecording" nomargin color="danger-500" size="400">
          Recording... Click to send
        </j-text>
        <j-text v-else-if="isTranscribing" nomargin color="primary-500" size="400">
          Transcribing...
        </j-text>
        <j-text v-else nomargin color="ui-400" size="300">
          Click to record voice message
        </j-text>
      </div>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { Ad4mClient } from '@coasys/ad4m';
import { Message } from '@coasys/flux-api';
import { ref, computed, onUnmounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';

interface Transcript {
  id: string;
  text: string;
  timestamp: Date;
  state: 'transcribing' | 'saving' | 'saved' | 'aborted';
}

const props = defineProps<{
  client: Ad4mClient;
  perspective: any;
  source: string;
}>();

const isRecording = ref(false);
const isTranscribing = ref(false);
const previewText = ref('');
const transcripts = ref<Transcript[]>([]);
const currentTranscriptId = ref('');

// Audio capture refs (AudioWorklet approach)
let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let stream: MediaStream | null = null;
let transcriptionStreamId: string | null = null;
let fastTranscriptionStreamId: string | null = null;

const currentTranscript = computed(() => 
  transcripts.value.find(t => t.id === currentTranscriptId.value)
);

function handleTranscriptionText(text: string) {
  previewText.value = '';
  const transcript = currentTranscript.value;
  if (transcript) {
    transcript.text += text;
  }
}

function handleTranscriptionPreview(text: string) {
  previewText.value = text;
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
  
  // Close transcription streams
  if (transcriptionStreamId) {
    await props.client.ai.closeTranscriptionStream(transcriptionStreamId);
    transcriptionStreamId = null;
  }
  if (fastTranscriptionStreamId) {
    await props.client.ai.closeTranscriptionStream(fastTranscriptionStreamId);
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
    previewText.value = '';
    
    // Initialize new transcript
    const id = uuidv4();
    currentTranscriptId.value = id;
    transcripts.value = [{
      id,
      text: '',
      timestamp: new Date(),
      state: 'transcribing'
    }];
    
    // Get microphone access
    stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true, noiseSuppression: true } 
    });
    
    // Open transcription streams (final + preview)
    transcriptionStreamId = await props.client.ai.openTranscriptionStream(
      'Whisper',
      handleTranscriptionText,
      { startThreshold: 0.8 }
    );
    
    fastTranscriptionStreamId = await props.client.ai.openTranscriptionStream(
      'whisper_tiny_quantized',
      handleTranscriptionPreview,
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
    
    // Handle audio data from worklet
    workletNode.port.onmessage = (event) => {
      if (isRecording.value) {
        const audioData = Array.from(event.data);
        // Feed to both transcription streams
        props.client.ai.feedTranscriptionStream(
          [fastTranscriptionStreamId!, transcriptionStreamId!], 
          audioData as any
        );
      }
    };
    
    mediaStreamSource.connect(workletNode);
    workletNode.connect(audioContext.destination);
    
    isRecording.value = true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    transcripts.value = [];
    await cleanup();
  }
}

async function stopRecording() {
  if (!isRecording.value) return;
  
  isRecording.value = false;
  isTranscribing.value = true;
  
  await cleanup();
  
  // Save the message
  const transcript = currentTranscript.value;
  if (transcript && transcript.text.trim()) {
    transcript.state = 'saving';
    
    try {
      const message = new Message(props.perspective, undefined, props.source);
      message.body = transcript.text.trim();
      message.transcriptStartedAt = transcript.timestamp.toISOString();
      await message.save();
      
      transcript.state = 'saved';
      
      // Clear transcript after a delay
      setTimeout(() => {
        transcripts.value = [];
        currentTranscriptId.value = '';
      }, 2000);
    } catch (e) {
      console.error('Failed to save voice message:', e);
      transcript.state = 'aborted';
    }
  } else {
    // No text captured, abort
    if (transcript) {
      transcript.state = 'aborted';
    }
    setTimeout(() => {
      transcripts.value = [];
      currentTranscriptId.value = '';
    }, 1000);
  }
  
  isTranscribing.value = false;
}

async function cancelRecording() {
  if (!isRecording.value && !isTranscribing.value && transcripts.value.length === 0) return;
  
  isRecording.value = false;
  
  await cleanup();
  
  // Clear without saving
  transcripts.value = [];
  currentTranscriptId.value = '';
  previewText.value = '';
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
  bottom: var(--j-space-600);
  right: var(--j-space-600);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  .transcript-card {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: var(--j-border-radius);
    box-shadow: var(--j-shadow-lg);
    width: 400px;
    max-width: 90vw;
    backdrop-filter: blur(4px);
    
    .transcript-item {
      padding: var(--j-space-300);
      max-width: 100%;
      overflow-wrap: break-word;
      word-break: break-word;
    }
  }
  
  .recorder-controls {
    background-color: var(--j-color-ui-50);
    border-radius: var(--j-border-radius);
    padding: var(--j-space-300) var(--j-space-400);
    box-shadow: var(--j-shadow-md);
    width: auto;
    min-width: 280px;
    max-width: 400px;
    
    .recorder-status {
      flex: 1;
      min-width: 0;
      overflow-wrap: break-word;
    }
  }
}
</style>
