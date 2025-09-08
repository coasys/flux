<template>
  <div class="call-controls">
    <j-tooltip placement="top" :title="mediaSettings.audioEnabled ? 'Mute microphone' : 'Unmute microphone'">
      <j-button
        :variant="mediaSettings.audioEnabled ? '' : 'primary'"
        @click="mediaDeviceStore.toggleAudio"
        square
        circle
        size="lg"
      >
        <j-icon :name="mediaSettings.audioEnabled ? 'mic' : 'mic-mute'" />
      </j-button>
    </j-tooltip>

    <j-tooltip placement="top" :title="mediaSettings.videoEnabled ? 'Disable camera' : 'Enable camera'">
      <j-button
        :variant="mediaSettings.videoEnabled ? '' : 'primary'"
        @click="mediaDeviceStore.toggleVideo"
        square
        circle
        size="lg"
        :disabled="!availableDevices.filter((d) => d.kind === 'videoinput').length"
      >
        <j-icon :name="mediaSettings.videoEnabled ? 'camera-video' : 'camera-video-off'" />
      </j-button>
    </j-tooltip>

    <j-tooltip placement="top" :title="mediaSettings.screenShareEnabled ? 'Stop sharing' : 'Share screen'">
      <j-button
        :variant="mediaSettings.screenShareEnabled ? 'primary' : ''"
        @click="mediaDeviceStore.toggleScreenShare"
        square
        circle
        size="lg"
        :disabled="!inCall"
      >
        <j-icon name="display" />
      </j-button>
    </j-tooltip>

    <j-tooltip placement="top" :title="`${transcriptionEnabled ? 'Disable' : 'Enable'} transcription`">
      <j-button
        :variant="transcriptionEnabled ? '' : 'primary'"
        :disabled="!inCall"
        @click="aiStore.toggleTranscriptionEnabled"
        square
        circle
        size="lg"
      >
        <TranscriptionIcon :enabled="transcriptionEnabled" />
      </j-button>
    </j-tooltip>

    <j-popover ref="emojiPopover" placement="top">
      <j-tooltip slot="trigger" placement="top" title="Send reaction">
        <j-button variant="transparent" square circle :disabled="!inCall" size="lg">
          <j-icon name="emoji-neutral" />
        </j-button>
      </j-tooltip>
      <div slot="content">
        <j-emoji-picker class="emoji-picker" @change="onEmojiClick" />
      </div>
    </j-popover>

    <j-tooltip v-if="!isMobile" placement="top" :title="callWindowFullscreen ? 'Shrink screen' : 'Full screen'">
      <j-button @click="uiStore.toggleCallWindowFullscreen" square circle size="lg">
        <j-icon :name="`arrows-angle-${callWindowFullscreen ? 'contract' : 'expand'}`" />
      </j-button>
    </j-tooltip>

    <j-popover ref="videoLayoutPopover" placement="top">
      <j-tooltip slot="trigger" placement="top" title="Video layout options">
        <j-button variant="transparent" square circle :disabled="!inCall" size="lg">
          <j-icon name="grid" />
        </j-button>
      </j-tooltip>
      <j-menu slot="content">
        <j-menu-item
          v-for="option in videoLayoutOptions"
          :key="option.label"
          @click="() => selectVideoLayout(option)"
          :selected="option.label === selectedVideoLayout.label"
        >
          <j-flex a="center" gap="400">
            <j-icon :name="option.icon" color="ui-500" />
            <j-text nomargin>{{ option.label }}</j-text>
          </j-flex>
        </j-menu-item>
      </j-menu>
    </j-popover>

    <j-tooltip placement="top" title="Call settings">
      <j-button @click="modalStore.showWebrtcSettings = !modalStore.showWebrtcSettings" square circle size="lg">
        <j-icon name="gear" />
      </j-button>
    </j-tooltip>

    <j-tooltip placement="top" title="Leave call">
      <j-button variant="danger" @click="webrtcStore.leaveRoom" square circle size="lg" :disabled="!inCall">
        <j-icon name="telephone-x" />
      </j-button>
    </j-tooltip>
  </div>
</template>

<script setup lang="ts">
import TranscriptionIcon from "@/components/icons/TranscriptionIcon.vue";
import {
  useAiStore,
  useAppStore,
  useMediaDevicesStore,
  useModalStore,
  useUiStore,
  useWebrtcStore,
  WEBRTC_EMOJI,
} from "@/stores";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useVideoLayout } from "../composables/useVideoLayout";

const appStore = useAppStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();
const mediaDeviceStore = useMediaDevicesStore();
const modalStore = useModalStore();
const aiStore = useAiStore();

const { me } = storeToRefs(appStore);
const { callWindowFullscreen, isMobile } = storeToRefs(uiStore);
const { mediaSettings, availableDevices } = storeToRefs(mediaDeviceStore);
const { transcriptionEnabled } = storeToRefs(aiStore);
const { inCall } = storeToRefs(webrtcStore);

const { videoLayoutOptions, selectedVideoLayout, selectVideoLayout } = useVideoLayout();

const emojiPopover = ref<HTMLElement | null>(null);
const videoLayoutPopover = ref<HTMLElement | null>(null);

function onEmojiClick(e: CustomEvent<{ native?: string }>) {
  const emoji = e?.detail?.native;
  const did = me.value?.did;
  if (!emoji || !did) {
    emojiPopover.value?.removeAttribute("open");
    return;
  }
  webrtcStore.signalAgentsInCall(WEBRTC_EMOJI, emoji);
  webrtcStore.displayEmoji(emoji, did);
  emojiPopover.value?.removeAttribute("open");
}
</script>

<style scoped lang="scss">
.call-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--j-space-400);
  padding: var(--j-space-400);
  font-family: var(--j-font-family);
  border-radius: var(--j-border-radius);
  background-color: #ffffff08;
}
</style>
