<template>
  <div class="media-player" @click="onClick">
    <video
      class="video"
      :srcObject.prop="stream"
      :muted="isMe"
      :style="{ opacity: hasVisibleStream ? 1 : 0 }"
      autoplay
      playsinline
    />

    <div class="centered-content">
      <j-avatar
        v-if="!showMicDisabledWarning && !showCameraDisabledWarning"
        :initials="profile?.username?.charAt(0) || '?'"
        :src="profile?.profileThumbnailPicture || null"
        :hash="profile?.did"
        size="xl"
        style="z-index: 1"
      />

      <j-flex v-if="showMicDisabledWarning" direction="column" a="center" gap="400">
        <j-icon name="mic-mute" size="xl" color="warning-500" />
        <j-text size="500" color="warning-500" nomargin>Please allow microphone access to join</j-text>
      </j-flex>

      <j-flex v-if="showCameraDisabledWarning" direction="column" a="center" gap="300">
        <j-icon name="camera-video-off" size="xl" color="warning-500" />
        <j-text size="600" color="warning-500" nomargin>Camera access denied</j-text>
        <j-text size="400" color="warning-500" nomargin>Please enable it in the browser</j-text>
      </j-flex>
    </div>

    <div v-if="loading" class="loading">
      <j-spinner />
      <j-text>{{ loadingMessage }}</j-text>
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
          <j-tooltip placement="top" :title="callWindowFullscreen ? 'Shrink screen' : 'Full screen'">
            <j-button @click="uiStore.toggleCallWindowFullscreen" square circle size="lg">
              <j-icon :name="`arrows-angle-${callWindowFullscreen ? 'contract' : 'expand'}`" />
            </j-button>
          </j-tooltip>
        </j-flex>
      </div>

      <j-flex v-if="inCall" class="settings" gap="500">
        <j-icon v-if="!audioEnabled" name="mic-mute" />
        <j-icon v-if="screenShareEnabled" name="display" />
      </j-flex>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { CallEmoji, MediaPermissions, MediaSettings, useModalStore, useUiStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, onMounted, PropType, ref, toRefs, watch } from "vue";

const props = defineProps({
  isMe: { type: Boolean, default: false },
  did: { type: String, default: "" },
  inCall: { type: Boolean, default: false },
  stream: { type: MediaStream, default: null },
  mediaSettings: { type: Object as PropType<MediaSettings>, default: null },
  mediaPermissions: { type: Object as PropType<MediaPermissions>, default: null },
  emojis: { type: Array as PropType<CallEmoji[]>, default: [] },
  onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: () => {} },
});
const { isMe, did, stream } = toRefs(props);

const uiStore = useUiStore();
const modalStore = useModalStore();

const { callWindowFullscreen } = storeToRefs(uiStore);

const profile = ref<Profile>();
const loading = ref(false);
const loadingMessage = ref("");

const audioEnabled = computed(() => props.mediaSettings?.audioEnabled ?? true);
const videoEnabled = computed(() => props.mediaSettings?.videoEnabled ?? false);
const screenShareEnabled = computed(() => props.mediaSettings?.screenShareEnabled ?? false);
const mediaPermissions = computed(() => props.mediaPermissions ?? null);
const hasVisibleStream = computed(() => stream && (videoEnabled.value || screenShareEnabled.value));
const showMicDisabledWarning = computed(
  () => isMe && mediaPermissions.value?.microphone.requested && !mediaPermissions.value?.microphone.granted
);
const showCameraDisabledWarning = computed(
  () =>
    isMe && videoEnabled.value && mediaPermissions.value?.camera.requested && !mediaPermissions.value?.camera.granted
);

watch(
  () => props.mediaSettings,
  (newMediaSettings, oldMediaSettings) => {
    if (isMe.value) return;

    console.log("*** Media settings changed in MediaPlayer, checking loading state");

    // Detect when someone enables video, screenshare, or audio
    const videoLoading = !oldMediaSettings?.videoEnabled && newMediaSettings?.videoEnabled;
    const screenShareLoading = !oldMediaSettings?.screenShareEnabled && newMediaSettings?.screenShareEnabled;
    const audioLoading = !oldMediaSettings?.audioEnabled && newMediaSettings?.audioEnabled;

    if (videoLoading || screenShareLoading || audioLoading) {
      console.log("*** Media settings changed, setting loading state");

      // Display loading message
      loading.value = true;
      let newLoadingMessage = "";
      if (videoLoading) newLoadingMessage = "Video loading...";
      else if (screenShareLoading) newLoadingMessage = "Screenshare loading...";
      else if (audioLoading) newLoadingMessage = "Audio loading...";
      loadingMessage.value = newLoadingMessage;
    }
  },
  { deep: true }
);

watch(
  () => props.stream,
  (newStream) => {
    if (isMe.value || !newStream || !loading.value) return;

    console.log("*** New stream detected in MediaPlayer, checking loading state");

    // Check if the expected tracks are now present
    const hasVideo = newStream.getVideoTracks().length > 0;
    const hasAudio = newStream.getAudioTracks().length > 0;

    const expectsVideo = props.mediaSettings?.videoEnabled || props.mediaSettings?.screenShareEnabled;
    const expectsAudio = props.mediaSettings?.audioEnabled;

    // If we have the tracks we're waiting for, clear loading
    if ((expectsVideo && hasVideo) || (expectsAudio && hasAudio)) {
      console.log("*** Loading complete, clearing loading state");
      loading.value = false;
      loadingMessage.value = "";
    } else {
      console.log("*** Still loading, waiting for tracks to be ready");
    }
  },
  { deep: true }
);

// Get profile on mount
onMounted(async () => (profile.value = await getCachedAgentProfile(did.value)));
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

  .loading {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--j-space-400);
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

    .settings {
    }
  }
}
</style>
