<template>
  <div class="transcriber">
    <template v-if="modelsReady">
      <j-box v-if="transcripts.length || previewText" mb="300">
        <j-flex direction="column" gap="400">
          <span
            v-if="!transcripts.length && previewText"
            :style="{ fontStyle: 'italic', color: 'var(--j-color-ui-300)' }"
          >
            {{ previewText }}
          </span>
          <div
            v-for="transcript in transcripts"
            :key="transcript.id"
            :id="`transcript-${transcript.id}`"
            class="transcript"
          >
            <j-flex direction="column" gap="300">
              <j-text nomargin>
                <j-timestamp :value="transcript.timestamp" dateStyle="short" timeStyle="short" size="sm" />
              </j-text>
              <j-text nomargin size="500" color="ui-white">
                {{ transcript.text }}
                <span
                  v-if="previewText && transcript.id === transcriptId"
                  :style="{ fontStyle: 'italic', color: 'var(--j-color-ui-300)' }"
                >
                  {{ previewText }}
                </span>
              </j-text>
              <j-flex v-if="transcript.state === 'transcribing'" gap="400" a="center">
                <j-spinner size="xxs" />
                <j-text nomargin size="500" color="primary-600"> Transcribing... </j-text>
              </j-flex>
              <j-flex v-if="transcript.state === 'saved'" gap="400" a="center">
                <j-icon name="check-circle" color="success-600" size="xs" />
                <j-text nomargin size="500" color="success-600"> Saved </j-text>
              </j-flex>
              <j-flex v-if="transcript.state === 'aborted'" gap="400" a="center">
                <j-icon name="x-circle" color="danger-600" size="xs" />
                <j-text nomargin size="500" color="danger-600"> Aborted </j-text>
              </j-flex>
            </j-flex>
          </div>
        </j-flex>
      </j-box>

      <j-box mb="300">
        <j-flex gap="400" j="between" a="center">
          <j-text nomargin uppercase size="400" weight="800" color="primary-500">Transcriber</j-text>
          <j-flex a="center">
            <j-tooltip
              placement="top"
              :title="`${browser === 'chrome' ? 'Use' : 'Using'} local AI for transcription`"
              style="margin-right: 12px; height: 22px"
              :style="{ cursor: browser === 'chrome' ? 'pointer' : 'default' }"
            >
              <Ad4mLogo
                width="22"
                height="22"
                :color="`var(--j-color-primary-${useRemoteService ? 300 : 500})`"
                @click="browser === 'chrome' && toggleRemoteService()"
              />
            </j-tooltip>
            <j-toggle
              :checked="browser === 'chrome' && useRemoteService"
              :disabled="browser !== 'chrome'"
              @change="toggleRemoteService"
              size="sm"
            />
            <j-tooltip
              placement="top"
              :title="
                browser === 'chrome'
                  ? 'Use Google AI for transcription'
                  : 'Open Flux in Chrome to enable Google AI transcription'
              "
              style="margin-left: -5px; height: 22px"
              :style="{ cursor: browser === 'chrome' ? 'pointer' : 'default' }"
            >
              <j-icon
                name="google"
                size="sm"
                :color="useRemoteService ? 'primary-500' : 'primary-300'"
                @click="browser === 'chrome' && toggleRemoteService()"
              />
            </j-tooltip>
          </j-flex>
        </j-flex>
      </j-box>

      <j-flex v-if="mediaSettings.audioEnabled" gap="300" a="center">
        <RecordingIcon :size="30" :style="{ flexShrink: 0, marginLeft: '-5px' }" />
        <j-text nomargin :style="{ flexShrink: 0, marginRight: '10px' }">Listening...</j-text>
        <div class="volumeThreshold">
          <div id="volume" class="volume"></div>
        </div>
      </j-flex>
      <j-flex v-else gap="400" a="center">
        <j-icon name="mic-mute" />
        <j-text nomargin :style="{ flexShrink: 0, marginRight: '20px' }">Audio muted</j-text>
      </j-flex>
    </template>
    <template v-else>
      <j-flex direction="column" gap="300">
        <j-flex j="between" a="center">
          <j-text nomargin uppercase size="400" weight="800" color="primary-500">Transcriber</j-text>
          <j-flex a="center" gap="400">
            <j-tooltip placement="top" title="Transcriber info" style="cursor: pointer">
              <j-icon name="info-circle" size="sm" color="ui-500" @click="infoModalOpen = true" />
            </j-tooltip>
            <j-tooltip
              placement="top"
              title="Refresh AI models"
              :style="{ cursor: loadingAIData ? 'auto' : 'pointer' }"
            >
              <j-icon name="arrow-repeat" :color="loadingAIData ? 'ui-300' : 'ui-500'" @click="aiStore.loadAIData" />
            </j-tooltip>
          </j-flex>
        </j-flex>

        <j-flex gap="300">
          <j-text nomargin weight="800" size="400">Whisper:</j-text>
          <j-text v-if="!whisperLoadingStatus" nomargin size="400">Model not found</j-text>
          <j-text v-else-if="whisperLoadingStatus.progress !== 100" size="400" nomargin>
            {{ whisperLoadingStatus.progress }}% loaded...
          </j-text>
          <j-text v-else nomargin size="400">Ready</j-text>
        </j-flex>

        <j-flex gap="300">
          <j-text nomargin weight="800" size="400">Whisper tiny:</j-text>
          <j-text v-if="!whisperTinyLoadingStatus" nomargin size="400">Model not found</j-text>
          <j-text v-else-if="whisperTinyLoadingStatus.progress !== 100" nomargin size="400">
            {{ whisperTinyLoadingStatus.progress }}% loaded...
          </j-text>
          <j-text v-else nomargin size="400">Ready</j-text>
        </j-flex>
      </j-flex>
    </template>
  </div>

  <j-modal :open="infoModalOpen" @toggle="(e: any) => (infoModalOpen = e.target.open)" style="pointer-events: all">
    <j-box p="600">
      <j-flex a="center" direction="column" gap="400">
        <j-icon name="robot" size="xl" color="ui-500" />
        <j-flex a="center" gap="400">
          <j-text uppercase nomargin color="primary-500">Transcriber models</j-text>
          <j-icon name="arrow-repeat" color="ui-500" @click="aiStore.loadAIData" style="cursor: pointer" />
        </j-flex>

        <j-box my="400">
          <j-text>Open the Ad4m launcher and navigate to the AI tab to view and/or edit your selected models</j-text>
        </j-box>

        <j-box my="400">
          <j-flex a="center" direction="column">
            <j-text uppercase color="primary-500">Whisper</j-text>
            <j-text>The main Whisper model used for full quality transcriptions</j-text>
            <template v-if="whisperLoadingStatus">
              <j-flex a="center" gap="300">
                <j-text nomargin weight="800">Downloaded:</j-text>
                <j-text nomargin>{{ whisperLoadingStatus.downloaded }}</j-text>
              </j-flex>
              <j-flex a="center" gap="300">
                <j-text nomargin weight="800">Progress:</j-text>
                <j-text nomargin>{{ whisperLoadingStatus.progress }}%</j-text>
              </j-flex>
              <j-flex a="center" gap="300">
                <j-text nomargin weight="800">Status:</j-text>
                <j-text nomargin>{{ whisperLoadingStatus.status }}</j-text>
              </j-flex>
            </template>
            <template v-else>
              <j-text nomargin>No whisper model found</j-text>
            </template>
          </j-flex>
        </j-box>

        <j-box my="400">
          <j-flex a="center" direction="column">
            <j-text uppercase color="primary-500">Whisper Tiny</j-text>
            <j-text>The smaller quantized Whisper model used for transcription previews</j-text>
            <template v-if="whisperTinyLoadingStatus">
              <j-flex a="center" gap="300">
                <j-text nomargin weight="800">Downloaded:</j-text>
                <j-text nomargin>{{ whisperTinyLoadingStatus.downloaded }}</j-text>
              </j-flex>
              <j-flex a="center" gap="300">
                <j-text nomargin weight="800">Progress:</j-text>
                <j-text nomargin>{{ whisperTinyLoadingStatus.progress }}%</j-text>
              </j-flex>
              <j-flex a="center" gap="300">
                <j-text nomargin weight="800">Status:</j-text>
                <j-text nomargin>{{ whisperTinyLoadingStatus.status }}</j-text>
              </j-flex>
            </template>
            <template v-else>
              <j-text nomargin>No whisper model found</j-text>
            </template>
          </j-flex>
        </j-box>
      </j-flex>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import Ad4mLogo from "@/components/ad4m-logo/Ad4mLogo.vue";
import RecordingIcon from "@/components/recording-icon/RecordingIcon.vue";
import { useAiStore, useMediaDevicesStore, useWebrtcStore } from "@/stores";
import { PerspectiveProxy } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { Message } from "@coasys/flux-api";
import { detectBrowser } from "@coasys/flux-utils";
import { storeToRefs } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const mediaDevicesStore = useMediaDevicesStore();
const aiStore = useAiStore();
const webrtcStore = useWebrtcStore();

const { mediaSettings, activeMicrophoneId } = storeToRefs(mediaDevicesStore);
const { loadingAIData, whisperLoadingStatus, whisperTinyLoadingStatus, transcriptionMessageTimeout } =
  storeToRefs(aiStore);
const { callRoute } = storeToRefs(webrtcStore);

const browser = detectBrowser();

const transcripts = ref<any[]>([]);
const useRemoteService = ref(false);
const previewText = ref("");
const usingRemoteService = ref(false);
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const dataArray = ref<Uint8Array | null>(null);
const sourceNode = ref<MediaStreamAudioSourceNode | null>(null);
const listening = ref(false);
const recognition = ref<any>(null);
const timeout = ref<ReturnType<typeof setTimeout> | null>(null);
const streamId = ref<string | null>(null);
const fastStreamId = ref<string | null>(null);
const transcriptId = ref<string>("");
const volumeCheckInterval = ref<ReturnType<typeof setInterval> | null>(null);
const infoModalOpen = ref(false);

const modelsReady = computed(
  () => whisperLoadingStatus.value?.progress === 100 && whisperTinyLoadingStatus.value?.progress === 100
);

function renderVolume() {
  if (listening.value && analyser.value && dataArray.value) {
    analyser.value.getByteTimeDomainData(dataArray.value);
    const maxValue = Math.max(...dataArray.value);
    const percentage = ((maxValue - 128) / 128) * 100;
    const volume = document.getElementById("volume");
    if (volume) volume.style.width = `${percentage < 3 ? 0 : percentage}%`;
    requestAnimationFrame(renderVolume);
  }
}

async function saveMessage() {
  if (!callRoute.value.communityId || !callRoute.value.channelId) return;

  const client = await getAd4mClient();
  const perspective = (await client.perspective.byUUID(callRoute.value.communityId)) as PerspectiveProxy;
  if (!perspective) return;

  // Fetch latest text & mark message as saving
  let text = "";
  previewText.value = "";
  transcripts.value = transcripts.value.map((t) => {
    if (t.id === transcriptId.value) {
      text = t.text;
      if (text) t.state = "saved";
      else t.state = "aborted";
    }
    return t;
  });

  // Store id for outro transitions
  const previousId = transcriptId.value;
  transcriptId.value = "";

  // Trigger outro transitions
  const transcriptCard = document.getElementById(`transcript-${previousId}`);

  if (text) {
    if (transcriptCard) {
      transcriptCard.classList.add("slideRight");
      setTimeout(() => {
        transcriptCard.classList.add("hide");
        setTimeout(() => {
          transcripts.value = [];
        }, 500);
      }, 500);
    }
    // Save message
    const newMessage = new Message(perspective, undefined, callRoute.value.channelId);
    newMessage.body = text;
    await newMessage.save();
  } else {
    if (transcriptCard) {
      transcriptCard.classList.add("slideLeft");
      setTimeout(() => {
        transcriptCard.classList.add("hide");
        setTimeout(() => {
          transcripts.value = [];
        }, 500);
      }, 500);
    }
  }
}

function addCurrentTranscript(text?: string) {
  if (!text) text = "";

  // Search for existing transcript
  const existingIndex = transcripts.value.findIndex((t) => t.id === transcriptId.value);

  if (existingIndex >= 0) {
    // If match found, update text
    transcripts.value[existingIndex].text += text;
  } else {
    // Otherwise initialise new transcript
    transcriptId.value = uuidv4();
    transcripts.value = [{ id: transcriptId.value, timestamp: new Date(), state: "transcribing", text }];
  }
}

function resetSaveTimeout() {
  if (timeout.value) clearTimeout(timeout.value);
  timeout.value = setTimeout(async () => {
    saveMessage();
  }, transcriptionMessageTimeout.value * 1000);
}

// Fires every time a new chunk of text is sent back from the AI service
async function handleTranscriptionText(text: string) {
  // Clear preview text when we get final text
  previewText.value = "";
  addCurrentTranscript(text);
  resetSaveTimeout();
}

async function handleTranscriptionPreview(text: string) {
  addCurrentTranscript();
  previewText.value += text;
  resetSaveTimeout();
}

function startRemoteTranscription() {
  const silenceTimeout = 2; // Seconds of silence before transcription saved
  const volumeThreshold = 20; // Volume theshold percentage below which transcription is ignored
  const volumeCheckIntervalDuration = 100; // Milliseconds between each volume check
  const historyLength = 1; // Seconds of volume history to store
  const volumeHistorySamplesPerSecond = (historyLength * 1000) / volumeCheckIntervalDuration;
  const volumeHistory = new Array(volumeHistorySamplesPerSecond).fill(0);
  let historyIndex = 0;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition.value = new SpeechRecognition();
  recognition.value.continuous = true;
  recognition.value.interimResults = true;

  // Only detect speech when volume is above threshold
  volumeCheckInterval.value = setInterval(() => {
    if (analyser.value && dataArray.value) {
      analyser.value.getByteTimeDomainData(dataArray.value);
      const maxValue = Math.max(...dataArray.value);
      const percentage = ((maxValue - 128) / 128) * 100;
      // Store last second of volume data for check in onresult function below
      volumeHistory[historyIndex] = percentage;
      historyIndex = (historyIndex + 1) % volumeHistorySamplesPerSecond;
    }
  }, volumeCheckIntervalDuration);

  let transcript = "";
  let interimTranscript = "";
  let accumulatedText = "";
  recognition.value.onresult = (event: any) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        final += result[0].transcript;
      } else {
        // Check if user was speaking in the volume history
        const userWasSpeaking = volumeHistory.some((vol) => vol > volumeThreshold);
        if (!userWasSpeaking) continue;

        interim += result[0].transcript;
        if (!transcriptId.value) {
          const id = uuidv4();
          transcriptId.value = id;
          transcripts.value = [{ id, text: accumulatedText + interim, timestamp: new Date(), done: false }];
        } else {
          const index = transcripts.value.findIndex((t) => t.id === transcriptId.value);
          if (index >= 0) {
            transcripts.value[index].text = accumulatedText + interim;
          }
        }
      }
    }

    // Accumulate final text
    if (final) {
      accumulatedText += final;
      transcript = accumulatedText;
    }
    interimTranscript = interim;

    // Reset silence timeout
    if (timeout.value) clearTimeout(timeout.value);

    // Start silence timeout when no interim text
    if (interim.length === 0) {
      timeout.value = setTimeout(async () => {
        if (accumulatedText.length > 0) {
          await saveMessage();
          accumulatedText = "";
          transcript = "";
          interimTranscript = "";
          transcriptId.value = "";
        }
      }, silenceTimeout * 1000);
    }
  };

  recognition.value.onerror = (event: any) => {
    if (event.error === "no-speech") return; // Ignore no-speech errors (fires whenever user stops speaking)
    console.error("Speech recognition error:", event.error);
  };

  recognition.value.onend = () => {
    // Restart if ended due to timeout (not user toggling to local service)
    if (usingRemoteService.value && recognition.value) recognition.value.start();
  };

  recognition.value.start();
}

async function startLocalTransciption(stream: MediaStream) {
  // Set up audio context & worklet node
  const client = await getAd4mClient();

  const moreDemaningParams = { startThreshold: 0.8 };
  streamId.value = await client.ai.openTranscriptionStream("Whisper", handleTranscriptionText, moreDemaningParams);

  const wordByWordParams = {
    startThreshold: 0.5, // Lower threshold to detect softer speech
    startWindow: 80, // Quick start detection
    endThreshold: 0.1, // Lower threshold to detect end of words
    endWindow: 50, // Short pause between words (100ms)
    timeBeforeSpeech: 20, // Include minimal context before speech
  };

  fastStreamId.value = await client.ai.openTranscriptionStream(
    "whisper_tiny_quantized",
    handleTranscriptionPreview,
    wordByWordParams
  );

  if (audioContext.value) {
    await audioContext.value.audioWorklet.addModule("/audio-processor.js");
    const mediaStreamSource = audioContext.value.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext.value, "audio-processor");
    mediaStreamSource.connect(workletNode);

    workletNode.port.onmessage = async (event) => {
      if (listening.value) {
        const audioData = Array.from(event.data);
        const client = await getAd4mClient();
        client.ai.feedTranscriptionStream(
          [fastStreamId.value, streamId.value].filter(Boolean) as string[],
          audioData as any
        );
      }
    };

    workletNode.connect(audioContext.value.destination);
  }
}

function startListening() {
  listening.value = true;
  navigator.mediaDevices
    .getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        deviceId: activeMicrophoneId.value ? { ideal: activeMicrophoneId.value } : undefined,
      },
    })
    .then(async (stream) => {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (useRemoteService.value) startRemoteTranscription();
      else startLocalTransciption(stream);

      // Set up analyser to render volume
      if (audioContext.value) {
        analyser.value = audioContext.value.createAnalyser();
        sourceNode.value = audioContext.value.createMediaStreamSource(stream);
        sourceNode.value.connect(analyser.value);
        analyser.value.fftSize = 2048;
        dataArray.value = new Uint8Array(analyser.value.fftSize);
        renderVolume();
      }
    });
}

async function stopListening() {
  listening.value = false;

  // Stop and cleanup all media tracks
  sourceNode.value?.mediaStream.getTracks().forEach((track) => track.stop());

  if (sourceNode.value) {
    sourceNode.value.disconnect();
    sourceNode.value = null;
  }

  if (audioContext.value) {
    audioContext.value.close();
    audioContext.value = null;
  }

  if (recognition.value) {
    recognition.value.stop();
    recognition.value = null;
  }

  if (volumeCheckInterval.value) {
    clearInterval(volumeCheckInterval.value);
    volumeCheckInterval.value = null;
  }

  if (streamId.value) {
    const client = await getAd4mClient();
    await client.ai.closeTranscriptionStream(streamId.value);
    streamId.value = null;
  }

  if (fastStreamId.value) {
    const client = await getAd4mClient();
    await client.ai.closeTranscriptionStream(fastStreamId.value);
    fastStreamId.value = null;
  }
}

function toggleRemoteService() {
  usingRemoteService.value = !usingRemoteService.value;
  useRemoteService.value = !useRemoteService.value;
}

function restartListening() {
  console.log("Restarting listening with new settings");
  stopListening();
  startListening();
}

onMounted(() => {
  if (mediaSettings.value.audioEnabled) startListening();
});

onUnmounted(() => stopListening());

// Watch for audio state changes
watch(
  () => mediaSettings.value.audioEnabled,
  (audioNowEnabled) => {
    if (audioNowEnabled) startListening();
    else stopListening();
  }
);

// Watch for remote service changes
watch(useRemoteService, () => {
  // Skip on first run by checking if audio context is present
  if (audioContext.value) restartListening();
});

// Watch for microphone changes and restart listening
watch(activeMicrophoneId, restartListening);
</script>

<style lang="scss" scoped>
.transcriber {
  pointer-events: auto;
  border-radius: var(--j-border-radius);
  margin: 20px 20px 0 20px;
  background-color: var(--j-color-ui-100);
  padding: var(--j-space-400);
  width: calc(100% - 40px);

  .volumeThreshold {
    position: relative;
    width: 100%;
    height: 30px;
    border-radius: 5px;
    background-color: var(--j-color-ui-200);

    .volume {
      position: absolute;
      height: 30px;
      border-radius: 5px;
      background-color: var(--j-color-primary-500);
    }
  }

  .transcript {
    border-radius: var(--j-border-radius);
    padding: var(--j-space-400);
    background-color: var(--j-color-ui-50);
    width: 100%;
    margin-left: 0;
    opacity: 1;
    max-height: 1000px;
    transition: all 1s;

    &.slideLeft {
      margin-left: -100%;
      opacity: 0;
    }

    &.slideRight {
      margin-left: 100%;
      opacity: 0;
    }

    &.hide {
      max-height: 0px;
    }
  }
}
</style>
