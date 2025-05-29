<!-- MediaPlayer.vue -->
<template>
  <div class="media-player">
    <!-- Video element -->
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
        v-if="profile && !hasVisibleStream && !showMicDisabledWarning && !showCameraDisabledWarning"
        :initials="profile.username?.charAt(0) || '?'"
        :src="profile.profileThumbnailPicture || null"
        :hash="profile.did"
        size="xl"
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

    <span class="username">
      {{ profile?.username || "Unknown user" }}
    </span>

    <div class="settings" v-if="!inCall">
      <j-flex gap="400">
        <j-tooltip placement="top" title="Settings">
          <j-button @click="toggleSettings" square circle size="lg">
            <j-icon name="gear" />
          </j-button>
        </j-tooltip>
        <j-tooltip placement="top">
          <j-button @click="() => null" square circle size="lg">
            <j-icon :name="`arrows-angle-${true ? 'contract' : 'expand'}`" />
          </j-button>
        </j-tooltip>
        <!-- <j-tooltip placement="top" :title="'callWindowOpen' ? 'Shrink screen' : 'Full screen'">
          <j-button @click="() => uiStore.setCallWindowOpen(false)" square circle size="lg">
            <j-icon :name="`arrows-angle-${callWindowOpen ? 'contract' : 'expand'}`" />
          </j-button>
        </j-tooltip> -->
      </j-flex>
    </div>

    <div class="settings" v-if="inCall">
      <j-icon v-if="!audioEnabled" name="mic-mute" />
      <j-icon v-if="screenShareEnabled" name="display" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defaultMediaPermissions, MediaPermissions } from "@/stores/mediaDevicesStore";
import { Profile } from "@coasys/flux-types";
import { computed, PropType } from "vue";

const { isMe, profile, stream, audioEnabled, videoEnabled, screenShareEnabled, mediaPermissions } = defineProps({
  isMe: { type: Boolean, default: false },
  profile: { type: Object as PropType<Profile | null>, default: null },
  inCall: { type: Boolean, default: false },
  stream: { type: MediaStream, default: null },
  audioEnabled: { type: Boolean, default: true },
  videoEnabled: { type: Boolean, default: true },
  screenShareEnabled: { type: Boolean, default: true },
  mediaPermissions: { type: Object as PropType<MediaPermissions>, default: defaultMediaPermissions },
});

// // Computed properties
const hasVisibleStream = computed(() => stream && (videoEnabled || screenShareEnabled));
const showMicDisabledWarning = computed(
  () => isMe && mediaPermissions?.microphone.requested && !mediaPermissions?.microphone.granted
);
const showCameraDisabledWarning = computed(
  () => isMe && videoEnabled && mediaPermissions?.camera.requested && !mediaPermissions?.camera.granted
);

// TODO: implement settings toggle
function toggleSettings() {
  console.log("toggle settings!");
}
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
  box-shadow: 0;
  transition:
    max-width 0.3s ease-out,
    box-shadow 0.2s ease;
  aspect-ratio: 16/9;

  .video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .centered-content {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .username {
    position: absolute;
    bottom: 0;
    left: 0;
    margin: var(--j-space-400);
    padding: var(--j-space-200) var(--j-space-400);
    color: white;
    background: #0000002e;
    border-radius: 10rem;
  }

  .settings {
    position: absolute;
    bottom: 0;
    right: 0;
    display: flex;
    padding: var(--j-space-400);
  }
}
</style>
