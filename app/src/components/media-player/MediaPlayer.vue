<template>
  <div class="media-player">
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

    <j-flex class="footer" j="between" a="end">
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
import { MediaPermissions, MediaSettings } from "@/stores/mediaDevicesStore";
import { useUiStore } from "@/stores/uiStore";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, onMounted, PropType, ref, toRefs, watch } from "vue";

const props = defineProps({
  isMe: { type: Boolean, default: false },
  did: { type: String, default: "" },
  inCall: { type: Boolean, default: false },
  stream: { type: MediaStream, default: null },
  mediaSettings: {
    type: Object as PropType<MediaSettings>,
    default: null,
  },
  mediaPermissions: { type: Object as PropType<MediaPermissions>, default: null },
});
const { isMe, did, stream } = toRefs(props);

const uiStore = useUiStore();
const { callWindowFullscreen } = storeToRefs(uiStore);

const profile = ref<Profile>();

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

// TODO: implement settings toggle
function toggleSettings() {
  console.log("toggle settings!");
}

// Get profile on mopunt
onMounted(async () => (profile.value = await getCachedAgentProfile(did.value)));

watch(
  () => props.mediaSettings,
  async (newMediaSettings) => {
    if (props.mediaSettings && !isMe?.value) {
      console.log("New media settings for other agent", newMediaSettings);
    }
  },
  { immediate: true }
);
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
  aspect-ratio: 16/9;
  width: 100%;
  height: auto;
  max-height: 100%;

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
