<template>
  <div class="voice-recorder">
    <!-- Transcription card (similar to call transcriber) -->
    <j-box v-if="transcripts.length || previewText" mb="300" class="transcript-card">
      <j-flex direction="column" gap="300">
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
            <j-flex v-if="transcript.state === 'transcribing'" gap="300" a="center">
              <j-spinner size="xxs" />
              <j-text nomargin size="300" color="primary-500"> Transcribing... </j-text>
            </j-flex>
          </j-flex>
        </div>
      </j-flex>
    </j-box>

    <!-- Recording button -->
    <j-flex gap="300" a="center" class="recorder-controls">
      <j-button
        @click="toggleRecording"
        :variant="isRecording ? 'danger' : 'primary'"
        :disabled="isTranscribing"
        circle
        size="lg"
      >
        <j-icon :name="isRecording ? 'stop-fill' : 'mic-fill'" size="lg" />
      </j-button>
      <j-text v-if="isRecording" nomargin color="danger-500" size="400">
        Recording... Click to stop
      </j-text>
      <j-text v-else-if="isTranscribing" nomargin color="primary-500" size="400">
        Transcribing...
      </j-text>
      <j-text v-else nomargin color="ui-400" size="300">
        Click to record voice message
      </j-text>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { Ad4mClient } from '@coasys/ad4m';
import { Message } from '@coasys/flux-api';
import { ref, computed } from 'vue';
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

// Audio recording refs
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;
let transcriptionStreamId: string | null = null;

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
  previewText.value += text;
}

async function startRecording() {
  try {
    audioChunks = [];
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
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Open transcription stream
    transcriptionStreamId = await props.client.ai.openTranscriptionStream(
      'Whisper',
      handleTranscriptionText,
      { startThreshold: 0.8 }
    );
    
    // Set up media recorder
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && transcriptionStreamId) {
        // Convert and feed to transcription
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioData = Array.from(new Int16Array(arrayBuffer));
          props.client.ai.feedTranscriptionStream([transcriptionStreamId!], audioData as any);
        };
        reader.readAsArrayBuffer(event.data);
      }
    };
    
    mediaRecorder.start(100);
    isRecording.value = true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    transcripts.value = [];
  }
}

async function stopRecording() {
  if (!isRecording.value) return;
  
  isRecording.value = false;
  isTranscribing.value = true;
  
  // Stop media recorder
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  // Stop tracks
  stream?.getTracks().forEach(track => track.stop());
  
  // Close transcription stream
  if (transcriptionStreamId) {
    await props.client.ai.closeTranscriptionStream(transcriptionStreamId);
    transcriptionStreamId = null;
  }
  
  // Save the message
  const transcript = currentTranscript.value;
  if (transcript && transcript.text.trim()) {
    transcript.state = 'saving';
    
    try {
      const message = new Message(props.perspective, undefined, props.source);
      message.body = `<p>${transcript.text.trim()}</p>`;
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

async function toggleRecording() {
  if (isRecording.value) {
    await stopRecording();
  } else {
    await startRecording();
  }
}
</script>

<style scoped lang="scss">
.voice-recorder {
  position: fixed;
  bottom: var(--j-space-600);
  right: var(--j-space-600);
  z-index: 100;
  
  .transcript-card {
    background-color: var(--j-color-ui-100);
    border-radius: var(--j-border-radius);
    box-shadow: var(--j-shadow-lg);
    max-width: 400px;
    
    .transcript-item {
      padding: var(--j-space-300);
    }
  }
  
  .recorder-controls {
    background-color: var(--j-color-ui-50);
    border-radius: var(--j-border-radius);
    padding: var(--j-space-300) var(--j-space-400);
    box-shadow: var(--j-shadow-md);
  }
}
</style>
