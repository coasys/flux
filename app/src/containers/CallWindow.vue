<template>
  <div class="wrapper">
    <div class="left-section" :style="{ width: `calc(${communitySidebarWidth}px + 100px)` }">
      <Transcriber v-if="inCall && transcriptionEnabled" />
      <div class="controls">
        <j-flex v-if="inCall" direction="column">
          <j-flex j="between" wrap>
            <j-box mb="300" mr="500">
              <j-tooltip :placement="'top'" title="Go to call channel">
                <j-flex
                  direction="column"
                  gap="100"
                  @click="router.push({ name: 'view', params: callRoute })"
                  style="cursor: pointer"
                >
                  <j-flex a="center" gap="200">
                    <div class="connection-icon">
                      <j-icon name="wifi" :color="callHealthColour" style="rotate: 45deg" />
                    </div>
                    <j-text :color="callHealthColour" nomargin> {{ connectionText }} </j-text>
                    <j-text v-if="connectionWarning" :color="callHealthColour" nomargin>
                      {{ connectionWarning }}
                    </j-text>
                  </j-flex>
                  <j-text nomargin size="400">
                    <b>{{ callCommunityName }}</b> / {{ callChannelName }}
                  </j-text>
                </j-flex>
              </j-tooltip>
            </j-box>

            <j-box mt="300">
              <j-flex a="center" gap="500">
                <j-tooltip :placement="'top'" :title="`${transcriptionEnabled ? 'Disable' : 'Enable'} transcription`">
                  <TranscriptionIcon
                    :enabled="transcriptionEnabled"
                    color="ui-500"
                    @click="aiStore.toggleTranscriptionEnabled"
                    style="cursor: pointer"
                  />
                </j-tooltip>

                <j-tooltip
                  :placement="'top'"
                  :title="`${mediaSettings.audioEnabled ? 'Disable' : 'Enable'} microphone`"
                >
                  <j-icon
                    :name="`mic${mediaSettings.audioEnabled ? '' : '-mute'}`"
                    color="ui-500"
                    @click="mediaDeviceStore.toggleAudio"
                  />
                </j-tooltip>

                <j-tooltip :placement="'top'" :title="`${mediaSettings.videoEnabled ? 'Disable' : 'Enable'} camera`">
                  <j-icon
                    :name="`camera-video${mediaSettings.videoEnabled ? '' : '-off'}`"
                    color="ui-500"
                    @click="mediaDeviceStore.toggleVideo"
                  />
                </j-tooltip>

                <j-tooltip v-if="mediaSettings.screenShareEnabled" :placement="'top'" title="Disable screen share">
                  <j-icon name="display" color="ui-500" @click="mediaDeviceStore.toggleScreenShare" />
                </j-tooltip>

                <j-tooltip :placement="'top'" title="Leave call">
                  <j-icon name="telephone-x" color="danger-500" @click="webrtcStore.leaveRoom" />
                </j-tooltip>
              </j-flex>
            </j-box>
          </j-flex>
        </j-flex>

        <j-flex j="between" a="center">
          <j-flex a="center" gap="300">
            <j-tooltip :placement="'top'" title="Go to profile">
              <j-avatar
                :hash="appStore.me.did"
                :src="myProfile?.profileThumbnailPicture"
                @click="profileClick"
                style="cursor: pointer"
              />
            </j-tooltip>

            <j-flex direction="column">
              <j-tooltip :placement="'top'" title="Go to profile">
                <j-text nomargin weight="600" @click="profileClick" style="cursor: pointer">
                  {{ myProfile?.username }}
                </j-text>
              </j-tooltip>

              <j-tooltip :placement="'top'" title="Set agent status">
                <j-popover
                  :open="showAgentStatusMenu"
                  @toggle="(e: any) => (showAgentStatusMenu = e.target.open)"
                  event="click"
                  placement="top-end"
                  style="cursor: pointer; margin-top: 2px"
                >
                  <j-flex slot="trigger" a="center" gap="100">
                    <div class="agent-status" :class="myAgentStatus" />
                    <j-text nomargin size="300">{{ myAgentStatus }}</j-text>
                  </j-flex>

                  <j-menu slot="content">
                    <j-menu-item
                      v-for="status in statusStates"
                      @click="
                        myAgentStatus = status;
                        showAgentStatusMenu = false;
                      "
                    >
                      <div slot="start" class="agent-status" :class="status" />
                      {{ status }}
                    </j-menu-item>
                  </j-menu>
                </j-popover>
              </j-tooltip>
            </j-flex>
          </j-flex>

          <j-flex a="center" gap="500">
            <j-tooltip :placement="'top'" title="Open app settings">
              <j-icon name="gear" color="ui-500" @click="router.push({ name: 'settings' })" />
            </j-tooltip>

            <j-tooltip
              v-if="inCall || route.params.channelId"
              :placement="'top'"
              :title="`${callWindowOpen ? 'Hide' : 'Show'} call window`"
            >
              <j-icon
                :name="`arrows-angle-${callWindowOpen ? 'contract' : 'expand'}`"
                color="ui-500"
                @click="() => uiStore.setCallWindowOpen(!callWindowOpen)"
              />
            </j-tooltip>
          </j-flex>
        </j-flex>
      </div>
    </div>

    <div ref="rightSection" class="right-section">
      <div
        ref="callWindow"
        class="call-window"
        :style="{ width: `${callWindowWidth}px`, opacity: callWindowOpen ? 1 : 0 }"
      >
        <div class="resize-handle" @mousedown="startResize" />

        <div class="call-window-header">
          <j-flex direction="column" gap="300">
            <j-text nomargin size="400">
              <b>{{ callCommunityName }}</b> / {{ callChannelName }}
            </j-text>

            <j-flex v-if="agentsInCall.length" a="center" gap="100" style="margin-left: -6px">
              <AvatarGroup :users="agentsInCall" size="xs" />
              <j-text size="400" nomargin color="ui-500">{{
                `${agentsInCall.length} agent${agentsInCall.length > 1 ? "s" : ""} in the call`
              }}</j-text>
            </j-flex>
          </j-flex>

          <button class="close-button" @click="() => uiStore.setCallWindowOpen(false)">
            <j-icon name="x" color="color-white" />
          </button>
        </div>

        <div class="call-window-content">
          <j-box v-if="!inCall" mb="500">
            <j-flex direction="column" a="center" gap="300">
              <j-text size="800" nomargin>You haven't joined this room</j-text>
              <j-text size="500" nomargin>Your microphone will be enabled.</j-text>
            </j-flex>
          </j-box>

          <div
            ref="videoGrid"
            class="video-grid"
            :class="selectedVideoLayout.class"
            :style="{ '--number-of-columns': numberOfColumns }"
          >
            <!-- Focused layout -->
            <template v-if="selectedVideoLayout.label === 'Focused'">
              <!-- Main focused video -->
              <MediaPlayer
                :key="focusedParticipant.did"
                :did="focusedParticipant.did"
                :isMe="focusedParticipant.isMe"
                :inCall="focusedParticipant.inCall"
                :stream="focusedParticipant.stream"
                :streamReady="focusedParticipant.streamReady"
                :audioState="focusedParticipant.audioState"
                :videoState="focusedParticipant.videoState"
                :screenShareState="focusedParticipant.screenShareState"
                :warning="focusedParticipant.warning"
                :emojis="callEmojis.filter((emoji) => emoji.author === focusedParticipant.did)"
                @click="focusOnVideo(focusedParticipant.did)"
                :style="{ maxHeight: unfocusedParticipants.length ? 'calc(100% - 140px)' : 'none' }"
              />

              <!-- Non-focused videos -->
              <j-flex v-if="unfocusedParticipants.length" j="center">
                <div class="bottom-row">
                  <MediaPlayer
                    v-for="participant in unfocusedParticipants"
                    :key="participant.did"
                    :did="participant.did"
                    :isMe="participant.isMe"
                    :inCall="participant.inCall"
                    :stream="participant.stream"
                    :streamReady="participant.streamReady"
                    :audioState="participant.audioState"
                    :videoState="participant.videoState"
                    :screenShareState="participant.screenShareState"
                    :warning="participant.warning"
                    :emojis="callEmojis.filter((emoji) => emoji.author === participant.did)"
                    @click="focusOnVideo(participant.did)"
                  />
                </div>
              </j-flex>
            </template>

            <!-- Other layouts (fixed aspect ratio, flexible) -->
            <template v-else>
              <MediaPlayer
                v-for="participant in allParticipants"
                :key="participant.did"
                :did="participant.did"
                :isMe="participant.isMe"
                :inCall="participant.inCall"
                :stream="participant.stream"
                :streamReady="participant.streamReady"
                :audioState="participant.audioState"
                :videoState="participant.videoState"
                :screenShareState="participant.screenShareState"
                :warning="participant.warning"
                :emojis="callEmojis.filter((emoji) => emoji.author === participant.did)"
                @click="focusOnVideo(participant.did)"
              />
            </template>
          </div>

          <template v-if="!inCall">
            <j-toggle
              :checked="mediaSettings.videoEnabled"
              :disabled="!mediaPermissions.microphone.granted"
              @change="mediaDeviceStore.toggleVideo"
            >
              Join with camera!
            </j-toggle>
            <j-button
              variant="primary"
              size="lg"
              :disabled="!mediaPermissions.microphone.granted"
              :loading="joiningCall"
              @click="webrtcStore.joinRoom"
            >
              Join room!
            </j-button>
          </template>

          <div v-if="inCall" class="call-controls">
            <j-tooltip :placement="'top'" :title="mediaSettings.audioEnabled ? 'Mute microphone' : 'Unmute microphone'">
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

            <j-tooltip :placement="'top'" :title="mediaSettings.videoEnabled ? 'Disable camera' : 'Enable camera'">
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

            <j-tooltip :placement="'top'" :title="mediaSettings.screenShareEnabled ? 'Stop sharing' : 'Share screen'">
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

            <j-tooltip placement="top" :title="callWindowFullscreen ? 'Shrink screen' : 'Full screen'">
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
        </div>

        <div class="call-window-footer">
          <div class="disclaimer" v-if="!inCall">
            <j-flex a="center" gap="300">
              <j-icon name="exclamation-circle" size="xs" color="warning-500" />
              <j-text size="400" nomargin color="warning-500"> This is a beta feature </j-text>
            </j-flex>
            <j-text size="300" nomargin color="warning-500">
              We use external STUN servers to establish the connection. Any further communication is peer-to-peer.
            </j-text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import MediaPlayer, { MediaPlayerWarning } from "@/components/media-player/MediaPlayer.vue";
import Transcriber from "@/components/transcriber/Transcriber.vue";
import TranscriptionIcon from "@/components/transcription-icon/TranscriptionIcon.vue";
import {
  MediaState,
  useAiStore,
  useAppStore,
  useMediaDevicesStore,
  useModalStore,
  useUiStore,
  useWebrtcStore,
  WEBRTC_EMOJI,
} from "@/stores";
import { AgentStatus } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const appStore = useAppStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();
const mediaDeviceStore = useMediaDevicesStore();
const modalStore = useModalStore();
const aiStore = useAiStore();

const { me, myProfile } = storeToRefs(appStore);
const { communitySidebarWidth, callWindowOpen, callWindowWidth, callWindowFullscreen } = storeToRefs(uiStore);
const { stream, mediaSettings, mediaPermissions, availableDevices } = storeToRefs(mediaDeviceStore);
const { transcriptionEnabled } = storeToRefs(aiStore);
const {
  joiningCall,
  inCall,
  callRoute,
  callHealth,
  callEmojis,
  agentsInCall,
  callCommunityName,
  callChannelName,
  myAgentStatus,
  peerConnections,
  disconnectedAgents,
} = storeToRefs(webrtcStore);

type LayoutOption = { label: string; class: string; icon: string };

const statusStates: AgentStatus[] = ["active", "asleep", "busy", "invisible"];
const videoLayoutOptions: LayoutOption[] = [
  { label: "16/9 aspect ratio", class: "16-by-9", icon: "aspect-ratio" },
  { label: "Flexible aspect ratio", class: "flexible", icon: "arrows-fullscreen" },
  { label: "Focused", class: "focused", icon: "person-video2" },
];

const callWindow = ref<HTMLElement | null>(null);
const rightSection = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const startWidth = ref(0);
const showAgentStatusMenu = ref(false);
const selectedVideoLayout = ref(videoLayoutOptions[0]);
const focusedVideoId = ref("");
const emojiPopover = ref<HTMLElement | null>(null);
const videoLayoutPopover = ref<HTMLElement | null>(null);

const callHealthColour = computed(findHealthColour);
const connectionWarning = computed(findConnectionWarning);
const connectionText = computed(findConnectionText);
const peers = computed(() => Array.from(peerConnections.value.values()));
const allParticipants = computed(() => {
  const { microphone, camera } = mediaPermissions.value;
  const { audioEnabled, videoEnabled, screenShareEnabled } = mediaSettings.value;
  let warning = "" as MediaPlayerWarning;
  if (microphone && microphone.requested && !microphone.granted) warning = "mic-disabled";
  else if (videoEnabled && camera && camera.requested && !camera.granted) warning = "camera-disabled";

  const myAgent = {
    isMe: true,
    did: me.value.did,
    inCall: inCall.value,
    stream: stream.value || undefined,
    streamReady: true,
    audioState: (audioEnabled ? "on" : "off") as MediaState,
    videoState: (videoEnabled ? "on" : "off") as MediaState,
    screenShareState: (screenShareEnabled ? "on" : "off") as MediaState,
    warning,
  };

  const otherAgents = peers.value.map((peer) => ({
    isMe: false,
    did: peer.did,
    inCall: true,
    stream: peer.streams?.[0] || undefined,
    streamReady: peer.streamReady,
    audioState: peer.audioState,
    videoState: peer.videoState,
    screenShareState: peer.screenShareState,
    warning: "" as MediaPlayerWarning,
  }));
  return [myAgent, ...otherAgents];
});
const focusedParticipant = computed(() => {
  const focusedId = focusedVideoId.value || me.value.did;
  return allParticipants.value.find((p) => p.did === focusedId) || allParticipants.value[0];
});
const unfocusedParticipants = computed(() => {
  const focusedId = focusedVideoId.value || me.value.did;
  return allParticipants.value.filter((p) => p.did !== focusedId);
});
const numberOfColumns = computed(() => {
  const userCount = peers.value.length + 1;
  if (userCount === 1 || callWindowWidth.value <= 600 || selectedVideoLayout.value.label === "Focused") return 1;
  else if ((userCount > 1 && userCount < 5) || (callWindowWidth.value > 600 && callWindowWidth.value <= 1200)) return 2;
  else if (userCount > 4 && userCount < 10) return 3;
  else if (userCount > 8 && userCount < 17) return 4;
  return 5;
});

function findHealthColour() {
  if (callHealth.value === "healthy") return "success-500";
  else if (callHealth.value === "warnings") return "warning-500";
  return "danger-500";
}

function findConnectionWarning() {
  if (callHealth.value === "healthy") return "";
  else if (callHealth.value === "warnings") return "(unstable)";
  else if (callHealth.value === "connections-lost") return "(lost peers)";
  return "";
}

function findConnectionText() {
  if (mediaSettings.value.videoEnabled) return "Video connected";
  else if (mediaSettings.value.audioEnabled) return "Voice connected";
  return "Connected";
}

function startResize(e: any) {
  if (!callWindow.value) return;
  startWidth.value = callWindow.value.getBoundingClientRect().width;
  isDragging.value = true;
  startX.value = e.clientX;

  // Prevent text selection & width transitions during drag
  const mainAppLayout = document.getElementById("app-layout-main");
  if (mainAppLayout) mainAppLayout.style.transition = "none";
  callWindow.value.style.transition = "none";
  document.body.classList.add("text-selection-disabled");

  // Add event listeners for mousemove and mouseup
  document.addEventListener("mousemove", doResize, false);
  document.addEventListener("mouseup", stopResize, false);
}

function doResize(e: any) {
  if (!rightSection.value) return;
  const minWidth = rightSection.value?.getBoundingClientRect().width / 5 || 0;
  const maxWidth = window.innerWidth - communitySidebarWidth.value - 100;
  const newWidth = startWidth.value + (startX.value - e.clientX);
  uiStore.setCallWindowWidth(Math.min(Math.max(minWidth, newWidth), maxWidth));
}

function stopResize() {
  if (!callWindow.value) return;
  isDragging.value = false;

  // Update the call window fullscreen state in the UI store after resize
  const fullWindowWidth = window.innerWidth;
  const isFullscreen = fullWindowWidth - callWindowWidth.value <= communitySidebarWidth.value + 100;
  uiStore.setCallWindowFullscreen(isFullscreen);

  // Reset the transition styles and remove the global resizing class
  const mainAppLayout = document.getElementById("app-layout-main");
  if (mainAppLayout) mainAppLayout.style.transition = "width 0.5s ease-in-out";
  callWindow.value.style.transition = "all 0.5s ease-in-out";
  document.body.classList.remove("text-selection-disabled");

  // Remove event listeners for mousemove and mouseup
  document.removeEventListener("mousemove", doResize);
  document.addEventListener("mouseup", stopResize, false);
}

function profileClick() {
  router.push({ name: "home", params: { did: me.value.did } });
}

function onEmojiClick(event: any) {
  webrtcStore.signalAgentsInCall(WEBRTC_EMOJI, event.detail.native);
  webrtcStore.displayEmoji(event.detail.native, me.value.did);

  emojiPopover.value?.removeAttribute("open");
}

function selectVideoLayout(layout: LayoutOption) {
  selectedVideoLayout.value = layout;
  videoLayoutPopover.value?.removeAttribute("open");
}

function focusOnVideo(did: string) {
  if (!inCall.value) return;

  focusedVideoId.value = did;
  if (selectedVideoLayout.value.label !== "Focused") {
    selectedVideoLayout.value = videoLayoutOptions[2];
  }
}

function closeFocusedVideoLayout() {
  selectedVideoLayout.value = videoLayoutOptions[0];
  focusedVideoId.value = "";
}

// Reset layout & focused video when the call window opens
// TODO: based this on leaving the call, not just opening the window, & store preferences in the webrtc store
watch(callWindowOpen, (open) => {
  if (open) closeFocusedVideoLayout();
});

// Watch disconnected agents and toggle off the focused video layout if the disconnected agent was focused
watch(
  disconnectedAgents,
  (disconnected) => {
    if (focusedVideoId.value && disconnected.includes(focusedVideoId.value)) closeFocusedVideoLayout();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
// Used to prevent text selection during call window drag resizing
:global(.text-selection-disabled) {
  user-select: none !important;
  cursor: col-resize !important;
  * {
    -webkit-user-drag: none !important;
    pointer-events: none !important;
  }
}

.wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 20;

  .left-section {
    position: relative;
    height: 100%;
    max-width: calc(33vw + 100px);
    min-width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-shrink: 0;

    .controls {
      pointer-events: auto;
      gap: var(--j-space-400);
      display: flex;
      flex-direction: column;
      margin: 20px;
      width: calc(100% - 40px);
      border-radius: 10px;
      padding: var(--j-space-400);
      background-color: var(--j-color-ui-100);

      j-avatar::part(base) {
        background-color: var(--j-color-ui-100);
        box-shadow: 0 0 0 1px var(--j-color-ui-200);
        border-radius: 50%;
      }

      j-icon {
        --j-icon-size: 22px;
        cursor: pointer;
      }

      .connection-icon {
        height: 26px;
        margin-left: -7px;

        j-icon {
          --j-icon-size: 26px;
        }
      }

      .agent-status {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: var(--j-color-ui-200);

        &.active {
          background-color: var(--j-color-success-500);
        }

        &.asleep {
          background-color: var(--j-color-warning-500);
        }

        &.busy {
          background-color: var(--j-color-danger-500);
        }

        &.invisible {
          border: 1px solid var(--j-color-ui-400);
        }
      }
    }
  }

  .right-section {
    width: 100%;
    position: relative;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;

    .call-window {
      position: relative;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: var(--j-space-500);
      background-color: #1c1a1f; // var(--app-drawer-bg-color); // var(--j-color-ui-50);
      transition: all 0.5s ease-in-out;

      .resize-handle {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 3px;
        background-color: var(--j-color-primary-500);
        cursor: col-resize;
        opacity: 0;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }
      }

      .call-window-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--j-space-400);

        .close-button {
          all: unset;
          cursor: pointer;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: var(--j-color-ui-200);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 5;
        }
      }

      .call-window-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: calc(100% - 80px);
        gap: var(--j-space-500);

        .video-grid {
          display: grid;
          grid-template-columns: repeat(var(--number-of-columns), 1fr);
          grid-gap: var(--j-space-400);
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
          grid-auto-rows: min-content;

          > div {
            aspect-ratio: 16/9;
            width: 100%;
            height: auto;
            max-height: 100%;
            border-radius: 10px;
          }

          &.flexible {
            height: 100%;
            grid-auto-rows: unset;

            > div {
              width: 100%;
              height: 100%;
              aspect-ratio: unset;
              min-height: 260px;
            }
          }

          &.focused {
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
            contain: strict;

            > div {
              flex: 1;
              width: 100%;
              height: 100%;
              aspect-ratio: unset;

              &.no-bottom-row {
                max-height: calc(100% - 20px);
              }
            }

            .bottom-row {
              display: flex;
              overflow-x: auto;
              gap: var(--j-space-400);
              height: 120px;

              > div {
                flex: 0 0 auto;
              }
            }
          }
        }

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
      }

      .call-window-footer {
        margin-top: var(--j-space-500);

        .disclaimer {
          display: flex;
          flex-direction: column;
          gap: var(--j-space-300);
          background-color: var(--j-color-warning-50);
          border: 1px solid var(--j-color-warning-500);
          border-radius: var(--j-border-radius);
          padding: var(--j-space-300);
          max-width: 350px;
          text-align: left;
        }
      }
    }
  }
}
</style>
