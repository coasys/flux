<template>
  <div class="media-player" @click="onClick">
    <video
      ref="videoElement"
      class="video"
      :muted="isMe"
      :style="{ opacity: showVideo ? 1 : 0, transform: flipVideo ? 'scaleX(-1)' : 'none' }"
      autoplay
      playsinline
    />

    <div class="centered-content">
      <j-avatar
        v-if="!warning"
        :initials="profile?.username?.charAt(0) || '?'"
        :src="profile?.profileThumbnailPicture || null"
        :hash="profile?.did"
        size="xl"
        style="z-index: 1"
      />

      <j-flex v-if="warning === 'mic-disabled'" direction="column" a="center" gap="400">
        <j-icon name="mic-mute" size="xl" color="warning-500" />
        <j-text size="500" color="warning-500" nomargin>Please allow microphone access to join</j-text>
      </j-flex>

      <j-flex v-if="warning === 'camera-disabled'" direction="column" a="center" gap="300">
        <j-icon name="camera-video-off" size="xl" color="warning-500" />
        <j-text size="600" color="warning-500" nomargin>Camera access denied</j-text>
        <j-text size="400" color="warning-500" nomargin>Please enable it in the browser</j-text>
      </j-flex>
    </div>

    <div v-if="loadingMessage" class="loading-message">
      <j-spinner />
      <j-text nomargin>{{ loadingMessage }}</j-text>
    </div>

    <j-flex v-if="emojis.length" class="emojis" gap="400">
      <div class="emoji" v-for="emoji in emojis">
        {{ emoji.emoji }}
      </div>
    </j-flex>

    <j-flex class="footer" j="between" a="end">
      <span class="username">
        {{ profile?.username || "Unknown user" }}
      </span>

      <div class="settings" v-if="!inCall">
        <j-flex gap="400">
          <j-tooltip placement="top" title="Settings">
            <j-button @click="modalStore.showWebrtcSettings = !modalStore.showWebrtcSettings" square circle size="lg">
              <j-icon name="gear" />
            </j-button>
          </j-tooltip>
          <j-tooltip v-if="!isMobile" placement="top" :title="callWindowFullscreen ? 'Shrink screen' : 'Full screen'">
            <j-button @click="uiStore.toggleCallWindowFullscreen" square circle size="lg">
              <j-icon :name="`arrows-angle-${callWindowFullscreen ? 'contract' : 'expand'}`" />
            </j-button>
          </j-tooltip>
        </j-flex>
      </div>

      <j-flex v-if="inCall" class="settings" gap="500">
        <j-icon v-if="audioState !== 'on'" name="mic-mute" />
        <j-icon v-if="screenShareState === 'on'" name="display" />
      </j-flex>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { CallEmoji, MediaState, useModalStore, useUiStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, nextTick, onBeforeUnmount, onMounted, PropType, ref, toRefs, watch } from "vue";

export type MediaPlayerWarning = "" | "mic-disabled" | "camera-disabled";

const props = defineProps({
  did: { type: String, default: "" },
  isMe: { type: Boolean, default: false },
  inCall: { type: Boolean, default: false },
  stream: { type: MediaStream, default: null },
  streamReady: { type: Boolean, default: false },
  audioState: { type: String as PropType<MediaState>, default: "on" },
  videoState: { type: String as PropType<MediaState>, default: "off" },
  screenShareState: { type: String as PropType<MediaState>, default: "off" },
  warning: { type: String as PropType<MediaPlayerWarning>, default: "" },
  emojis: { type: Array as PropType<CallEmoji[]>, default: [] },
  onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: () => {} },
});
const { did, stream } = toRefs(props);

const uiStore = useUiStore();
const modalStore = useModalStore();

const { callWindowFullscreen, isMobile } = storeToRefs(uiStore);

const profile = ref<Profile>();
const videoElement = ref<HTMLVideoElement>();

const showVideo = computed(() => !!stream.value && (props.videoState === "on" || props.screenShareState === "on"));
const flipVideo = computed(() => props.isMe && props.screenShareState !== "on");
const loadingMessage = computed(() => {
  if (!props.streamReady) return "Loading...";
  if (props.videoState === "loading") return "Video loading...";
  else if (props.screenShareState === "loading") return "Screenshare loading...";
  return "";
});

// Watch for stream changes and properly attach them to the video element
watch(
  stream,
  async (newStream, oldStream) => {
    if (!videoElement.value) return;

    // Avoid unnecessary updates
    if (newStream === oldStream) return;

    try {
      // Clear old stream
      if (oldStream && videoElement.value.srcObject === oldStream) videoElement.value.srcObject = null;

      // Set new stream
      if (newStream) {
        videoElement.value.srcObject = newStream;

        // Wait for next tick then try to play
        await nextTick();
        if (videoElement.value && !videoElement.value.paused) return;

        await videoElement.value.play();
      }
    } catch (error) {
      console.warn("Error setting video stream:", error);
    }
  },
  { immediate: true }
);

// Ensure proper cleanup
onBeforeUnmount(() => {
  if (videoElement.value) videoElement.value.srcObject = null;
});

onMounted(async () => {
  // Get user profile
  profile.value = await getCachedAgentProfile(did.value);
  // Attach stream to video element if not already set
  if (stream.value && videoElement.value && !videoElement.value.srcObject) {
    try {
      videoElement.value.srcObject = stream.value;
      await nextTick();
      if (videoElement.value.paused) await videoElement.value.play().catch(() => {});
    } catch (e) {
      console.warn('Mount attach stream failed', e);
    }
  }
});
</script>

<style lang="scss" scoped>
.media-player {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  font-family: var(--j-font-family);
  border-radius: var(--j-border-radius);
  background: var(--j-color-ui-50);
  overflow: hidden;
  cursor: pointer;

  .video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 2;
    transition: opacity 0.3s ease;
  }

  .centered-content {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-message {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--j-space-500);
    background: var(--j-color-ui-50);
    z-index: 3;
  }

  .emojis {
    position: absolute;
    left: var(--j-space-400);
    top: var(--j-space-400);
    z-index: 3;

    .emoji {
      font-size: 3rem;
    }
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: var(--j-space-400);
    z-index: 3;

    .username {
      padding: var(--j-space-200) var(--j-space-400);
      color: white;
      background: #0000002e;
      border-radius: 10rem;
    }
  }
}
</style>
