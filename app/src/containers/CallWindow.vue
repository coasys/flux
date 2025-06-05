<template>
  <div class="wrapper">
    <div class="left-section" :style="{ width: `calc(${communitySidebarWidth}px + 100px)` }">
      <div class="controls">
        <j-flex v-if="inCall" direction="column">
          <j-flex j="between" a="center">
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

            <j-flex a="center" gap="500">
              <j-icon
                :name="`mic${mediaSettings.audioEnabled ? '' : '-mute'}`"
                color="ui-500"
                @click="mediaDeviceStore.toggleAudio"
              />
              <j-icon
                :name="`camera-video${mediaSettings.videoEnabled ? '' : '-off'}`"
                color="ui-500"
                @click="mediaDeviceStore.toggleVideo"
              />
              <j-icon
                v-if="mediaSettings.screenShareEnabled"
                name="display"
                color="ui-500"
                @click="mediaDeviceStore.toggleScreenShare"
              />
              <j-icon name="telephone-x" color="danger-500" @click="webrtcStore.leaveRoom" />
            </j-flex>
          </j-flex>
        </j-flex>

        <j-flex j="between" a="center">
          <j-flex a="center" gap="300">
            <j-avatar
              :hash="appStore.me.did"
              :src="myProfile?.profileThumbnailPicture"
              @click="profileClick"
              style="cursor: pointer"
            />

            <j-flex direction="column">
              <j-text nomargin weight="600" @click="profileClick" style="cursor: pointer">
                {{ myProfile?.username }}
              </j-text>

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
            </j-flex>
          </j-flex>

          <j-flex a="center" gap="500">
            <j-icon name="gear" color="ui-500" @click="router.push({ name: 'settings' })" />
            <j-icon
              v-if="inCall || route.params.channelId"
              :name="`arrows-angle-${callWindowOpen ? 'contract' : 'expand'}`"
              color="ui-500"
              @click="() => uiStore.setCallWindowOpen(!callWindowOpen)"
            />
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

          <div ref="videoGrid" class="video-grid" :style="{ '--number-of-columns': numberOfColumns }">
            <!-- :class="[`video-count-${peers.length + 1}`, { fullscreen: callWindowFullscreen }]"  :class="`video-count-${peers.length + 1}`"-->
            <MediaPlayer
              isMe
              :did="me.did"
              :inCall="inCall"
              :stream="stream || undefined"
              :mediaSettings="mediaSettings"
              :mediaPermissions="mediaPermissions"
              :emojis="callEmojis.filter((emoji) => emoji.author === me.did)"
            />

            <MediaPlayer
              v-for="peer in peers"
              inCall
              :did="peer.did"
              :stream="peer.streams[0] || undefined"
              :mediaSettings="peer.agentState?.mediaSettings"
              :emojis="callEmojis.filter((emoji) => emoji.author === peer.did)"
            />
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

          <div v-if="inCall" class="footer-wrapper">
            <div class="footer">
              <j-tooltip
                :placement="'top'"
                :title="mediaSettings.audioEnabled ? 'Mute microphone' : 'Unmute microphone'"
              >
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
                  <svg
                    v-if="transcriptionEnabled"
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    fill="var(--j-color-primary-600)"
                    className="bi bi-type"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M 2.244,12.681 3.187,9.878 H 6.66 l 0.944,2.803 H 8.86 L 5.54,3.35 H 4.322 L 1,12.681 Z M 4.944,4.758 6.34,8.914 H 3.51 l 1.4,-4.156 z m 9.146,7.027 h 0.035 v 0.896 h 1.128 V 7.725 c 0,-1.51 -1.114,-2.345 -2.646,-2.345 -1.736,0 -2.59,0.916 -2.666,2.174 h 1.108 c 0.068,-0.718 0.595,-1.19 1.517,-1.19 0.971,0 1.518,0.52 1.518,1.464 V 8.559 H 12.19 c -1.647,0.007 -2.522,0.8 -2.522,2.058 0,1.319 0.957,2.18 2.345,2.18 1.06,0 1.716,-0.43 2.078,-1.011 z m -1.763,0.035 c -0.752,0 -1.456,-0.397 -1.456,-1.244 0,-0.65 0.424,-1.115 1.408,-1.115 h 1.805 v 0.834 c 0,0.896 -0.752,1.525 -1.757,1.525"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    fill="000"
                    className="bi bi-type"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M 12.607422 5.3808594 C 10.871424 5.3808594 10.017406 6.2966888 9.9414062 7.5546875 L 11.048828 7.5546875 C 11.116828 6.8366882 11.644407 6.3632812 12.566406 6.3632812 C 13.537405 6.3632812 14.083984 6.8841259 14.083984 7.828125 L 14.083984 8.5585938 L 12.189453 8.5585938 C 11.72128 8.5605836 11.32347 8.6322675 10.982422 8.7539062 L 11.75 9.5214844 C 11.905681 9.4849042 12.077836 9.4609375 12.279297 9.4609375 L 14.083984 9.4609375 L 14.083984 10.294922 C 14.083984 10.732791 13.902511 11.104958 13.601562 11.373047 L 14.058594 11.830078 C 14.068779 11.814645 14.082041 11.800814 14.091797 11.785156 L 14.125 11.785156 L 14.125 11.896484 L 14.910156 12.681641 L 15.253906 12.681641 L 15.253906 7.7246094 C 15.253906 6.2146109 14.13942 5.3808594 12.607422 5.3808594 z M 3.4824219 5.7109375 L 1 12.681641 L 2.2441406 12.681641 L 3.1875 9.8789062 L 6.6601562 9.8789062 L 7.6035156 12.681641 L 8.859375 12.681641 L 7.9785156 10.207031 L 6.1640625 8.3925781 L 6.3398438 8.9140625 L 3.5097656 8.9140625 L 4.3105469 6.5390625 L 3.4824219 5.7109375 z"
                    />
                    <path d="m 1.7879982,2.4928069 11.9999998,12.0000001 0.708,-0.708 -11.9999998,-12 z" />
                  </svg>
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

              <j-tooltip placement="top" title="Leave call">
                <j-button variant="danger" @click="webrtcStore.leaveRoom" square circle size="lg" :disabled="!inCall">
                  <j-icon name="telephone-x" />
                </j-button>
              </j-tooltip>

              <j-tooltip placement="top" title="Call settings">
                <j-button
                  @click="modalStore.showWebrtcSettings = !modalStore.showWebrtcSettings"
                  square
                  circle
                  size="lg"
                >
                  <j-icon name="gear" />
                </j-button>
              </j-tooltip>

              <j-tooltip placement="top" :title="callWindowFullscreen ? 'Shrink screen' : 'Full screen'">
                <j-button @click="uiStore.toggleCallWindowFullscreen" square circle size="lg">
                  <j-icon :name="`arrows-angle-${callWindowFullscreen ? 'contract' : 'expand'}`" />
                </j-button>
              </j-tooltip>
            </div>
          </div>

          <Transcriber v-if="inCall && transcriptionEnabled" />
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
import MediaPlayer from "@/components/media-player/MediaPlayer.vue";
import Transcriber from "@/components/transcriber/Transcriber.vue";
import {
  useAiStore,
  useAppStore,
  useMediaDevicesStore,
  useModalStore,
  useUiStore,
  useWebrtcStore,
  WEBRTC_EMOJI,
} from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { AgentStatus, Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();
const mediaDeviceStore = useMediaDevicesStore();
const modalStore = useModalStore();
const aiStore = useAiStore();

const { me } = storeToRefs(appStore);
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
} = storeToRefs(webrtcStore);

const statusStates = ["active", "asleep", "busy", "invisible"] as AgentStatus[];

const myProfile = ref<Profile | null>(null);
const showAgentStatusMenu = ref(false);
const callWindow = ref<HTMLElement | null>(null);
const rightSection = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const startWidth = ref(0);
const emojiPopover = ref<HTMLElement | null>(null);

const callHealthColour = computed(findHealthColour);
const connectionWarning = computed(findConnectionWarning);
const connectionText = computed(findConnectionText);
const peers = computed(() =>
  Array.from(peerConnections.value.values()).map((peer) => {
    const agentState = agentsInCall.value.find((agent) => agent.did === peer.did);
    return { ...peer, agentState };
  })
);
// const videoGrid = ref<HTMLElement | null>(null);
const numberOfColumns = computed(() => {
  // Constraints:
  // + if we base it purely on the number of participants it doesnt stack properly when the call window is small (3x3 grid when it should be 1x9 column etc.)
  // + if we base it purely on the screen size, it doesn't account for the number of participants (3 columns on full screen even when there's only 2 participants)
  const userCount = peers.value.length + 1;

  // const videoGridWidth = videoGrid.value?.getBoundingClientRect().width || 0;

  if (!inCall.value || userCount === 1 || callWindowWidth.value <= 600) return 1;
  else if ((userCount > 1 && userCount < 5) || (callWindowWidth.value > 600 && callWindowWidth.value <= 1200)) return 2;
  else if (userCount > 4 && userCount < 9) return 3;
  else if (userCount > 8 && userCount < 13) return 4;
  // else if (videoGridWidth < 300) return 1;
  // else if (videoGridWidth < 600) return 2;
  // else if (videoGridWidth < 900) return 3;
  // else if (videoGridWidth < 1200) return 4;
  // return 5;
});

// watch(numberOfColumns, (newValue) => {
//   console.log("numberOfColumns: ", newValue);
// });

// const gridColumnSize = computed(() => {
//   const userCount = peers.value.length;
//   return window.innerWidth <= 768
//     ? 1
//     : !inCall.value
//       ? 1
//       : userCount === 1
//         ? 1
//         : userCount > 1 && userCount <= 4
//           ? 2
//           : userCount > 4 && userCount <= 9
//             ? 3
//             : 4;
// });

// const userCount = peers.value.length;
// const gridColumnSize =
//   window.innerWidth <= 768
//     ? 1
//     : false
//       ? 1
//       : userCount === 1
//         ? 1
//         : userCount > 1 && userCount <= 4
//           ? 2
//           : userCount > 4 && userCount <= 9
//             ? 3
//             : 4;

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
  const channelView = document.getElementById("channel-view");
  if (channelView) channelView.style.transition = "none";
  callWindow.value.style.transition = "none";
  document.body.classList.add("text-selection-disabled");

  // Add event listeners for mousemove and mouseup
  document.addEventListener("mousemove", doResize, false);
  document.addEventListener("mouseup", stopResize, false);
}

function doResize(e: any) {
  if (!rightSection.value) return;
  const minWidth = rightSection.value?.getBoundingClientRect().width / 5 || 0;
  const newWidth = startWidth.value + (startX.value - e.clientX);
  uiStore.setCallWindowWidth(Math.max(minWidth, newWidth));
}

function stopResize() {
  if (!callWindow.value) return;
  isDragging.value = false;

  // Update the call window fullscreen state in the UI store based on the channel view width after resize
  const channelViewWidth = document.getElementById("channel-view")?.getBoundingClientRect().width;
  uiStore.setCallWindowFullscreen(channelViewWidth === 0);

  // Reset the transition styles and remove the global resizing class
  const channelView = document.getElementById("channel-view");
  if (channelView) channelView.style.transition = "width 0.5s ease-in-out";
  callWindow.value.style.transition = "all 0.5s ease-in-out";
  document.body.classList.remove("text-selection-disabled");

  // Remove event listeners for mousemove and mouseup
  document.removeEventListener("mousemove", doResize);
  document.addEventListener("mouseup", stopResize, false);
}

// TODO: store my profile in the app store
async function getMyProfile() {
  myProfile.value = await getCachedAgentProfile(me.value.did);
}

function profileClick() {
  router.push({ name: "home", params: { did: me.value.did } });
}

function onEmojiClick(event: any) {
  webrtcStore.messageAgentsInCall(WEBRTC_EMOJI, event.detail.native);
  webrtcStore.displayEmoji(event.detail.native, me.value.did);

  emojiPopover.value?.removeAttribute("open");
}

onMounted(getMyProfile);
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
      gap: 20px;
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
        height: 100%;
        gap: var(--j-space-500);

        // .video-grid {
        //   display: grid;
        //   grid-template-columns: repeat(var(--number-of-columns), 1fr);
        //   grid-gap: var(--j-space-500);
        //   width: 100%;
        //   justify-content: center;
        //   align-items: center;
        // }

        // .video-grid {
        //   display: flex;
        //   gap: var(--j-space-500);
        //   width: 100%;
        //   height: 100%;
        //   flex-wrap: wrap;
        //   justify-content: center;

        //   > div {
        //     min-width: 300px; /* Minimum width for each video */
        //     max-width: calc((100% / var(--number-of-columns)) - 30px);
        //     // width: calc(100% / var(--number-of-columns));
        //   }
        // }

        // .video-grid {
        //   display: grid;
        //   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        //   grid-auto-rows: minmax(0, 1fr); /* Rows share available height */
        //   gap: 10px;
        //   min-width: 200px;
        //   width: 100%; /* Adjustable by user */
        //   max-width: 100%;
        //   height: 100vh; /* Full height, adjust as needed */
        //   box-sizing: border-box;
        //   padding: 10px;
        //   background: #f0f0f0;
        //   resize: horizontal;
        //   overflow: auto;
        //   container-type: size; /* For container queries */
        // }

        // .video-grid:has(div:nth-child(1):nth-last-child(1)) {
        //   grid-template-columns: 1fr;
        // }

        // /* Two videos: side by side if wider, stacked if taller */
        // .video-grid:has(div:nth-child(2):nth-last-child(1)) {
        //   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        // }

        // /* Three videos: 2x2 grid, with bottom right empty */
        // .video-grid:has(div:nth-child(3):nth-last-child(1)) {
        //   grid-template-columns: repeat(2, minmax(200px, 1fr));
        //   grid-template-rows: repeat(2, minmax(112.5px, auto)); /* 112.5px = 200px * (9/16) for 16:9 aspect */
        // }
        // .video-grid:has(div:nth-child(3):nth-last-child(1)) div:nth-child(3) {
        //   grid-column: 1 / 3; /* Center the third video */
        //   justify-self: center;
        //   max-width: 200px; /* Maintain consistent size */
        // }

        // /* Handle aspect-based stacking for two videos using container queries */
        // @container (min-aspect-ratio: 1/1) {
        //   .video-grid:has(div:nth-child(2):nth-last-child(1)) {
        //     grid-template-columns: repeat(2, minmax(200px, 1fr));
        //   }
        // }
        // @container (max-aspect-ratio: 1/1) {
        //   .video-grid:has(div:nth-child(2):nth-last-child(1)) {
        //     grid-template-columns: 1fr;
        //   }
        // }

        // .video-grid {
        //   display: grid;
        //   gap: var(--j-space-500);
        //   width: 100%;
        //   justify-content: center;

        //   /* This is the magic - creates responsive columns */
        //   grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));

        //   /* For all video containers */
        //   & > * {
        //     aspect-ratio: 16/9;
        //     width: 100%;
        //     position: relative;
        //     overflow: hidden;
        //   }

        //   /* Special case for single video to prevent max-width issues */
        //   &.video-count-1 {
        //     grid-template-columns: minmax(0, 1fr);
        //   }

        //   /* Special case for 3 videos to center the last one */
        //   &.video-count-3 {
        //     & > :last-child {
        //       grid-column: 1 / -1; /* Span all columns */
        //       // max-width: min(100%, 600px);
        //       width: min(100%, 600px);
        //       justify-self: center;
        //       margin-left: auto; /* Additional centering */
        //       margin-right: auto; /* Additional centering */
        //     }

        //     // /* If wide enough for 3 columns, reset layout */
        //     // @media (min-width: 900px) {
        //     //   & > :last-child {
        //     //     grid-column: auto;
        //     //     max-width: none;
        //     //   }
        //     // }
        //   }

        //   /* When videos-5 and 2 columns, center the last one */
        //   &.video-count-5 {
        //     & > :last-child:nth-child(odd) {
        //       justify-self: center;
        //     }
        //   }
        // }

        // .video-grid {
        //   display: flex;
        //   flex-wrap: wrap;
        //   gap: var(--j-space-500);
        //   width: 100%;
        //   justify-content: center;

        //   /* Each video */
        //   & > * {
        //     flex: 1 1 300px; /* Grow, shrink, base width */
        //     min-width: 300px; /* Min width before wrapping */
        //     max-width: 100%;
        //     aspect-ratio: 16/9;
        //     position: relative;
        //     overflow: hidden;
        //   }

        //   /* Force single column on small screens */
        //   @media (max-width: 500px) {
        //     & > * {
        //       flex-basis: 100%;
        //       min-width: 100%;
        //     }
        //   }
        // }

        // very close
        .video-grid {
          display: flex;
          flex-wrap: wrap;
          gap: var(--j-space-500);
          width: 100%;
          justify-content: center;
          align-items: center; /* Center vertically */

          /* Each video container */
          & > * {
            /* Base sizing - consistent for all videos */
            flex: 0 0 auto; /* Don't grow, don't shrink, use calculated width */
            aspect-ratio: 16/9;

            /* For positioning of content inside */
            position: relative;
            overflow: hidden;

            /* Default sizing - one per row */
            width: min(100%, 600px); /* Cap maximum size even in large windows */
          }

          /* When sidebar is narrow - stack vertically at full width */
          @container (max-width: 400px) {
            & > * {
              width: 100%;
            }
          }

          /* Small screens or 1 participant */
          @container (min-width: 401px) and (max-width: 700px) {
            & > * {
              width: min(100%, 500px); /* Cap size on small screens */
            }
          }

          /* Medium screens with 2-4 participants */
          @container (min-width: 701px) and (max-width: 1200px) {
            & > * {
              width: calc(50% - var(--j-space-500) / 2); /* Two per row */
            }

            /* For odd numbers of participants, center the last one */
            &:has(> :nth-child(odd):last-child) > :last-child {
              /* If we have 1, 3, 5 participants, center the last one */
              margin-left: auto;
              margin-right: auto;
            }
          }

          /* Large screens with 5+ participants */
          @container (min-width: 1201px) {
            & > * {
              width: calc(33.333% - var(--j-space-500) * 2 / 3); /* Three per row */
            }

            /* If there's a remainder when dividing by 3, center the last row */
            &:has(> :nth-child(3n + 1):last-child) > :last-child {
              /* If we have 1, 4, 7, etc. participants (remainder 1) */
              margin-left: auto;
              margin-right: auto;
            }

            &:has(> :nth-child(3n + 2):last-child) {
              /* If we have 2, 5, 8, etc. participants (remainder 2) */
              & > :nth-last-child(2),
              & > :last-child {
                /* Center the last two */
                margin-left: auto;
                margin-right: auto;
              }
            }
          }
        }

        // .video-grid {
        //   display: flex;
        //   flex-wrap: wrap;
        //   gap: var(--j-space-500);
        //   width: 100%;
        //   justify-content: center;

        //   /* Each video container */
        //   & > * {
        //     /* Responsive sizing with min width and aspect ratio */
        //     flex: 1 1 280px;
        //     min-width: 280px; /* Minimum width before wrapping */
        //     aspect-ratio: 16/9;

        //     /* Ensure the container doesn't get too big */
        //     max-width: 100%;

        //     /* For positioning of content inside */
        //     position: relative;
        //     overflow: hidden;
        //   }

        //   /* When sidebar is narrow - stack vertically */
        //   @container (max-width: 400px) {
        //     & > * {
        //       flex-basis: 100%;
        //       min-width: 100%;
        //     }
        //   }

        //   /* Optimize for 2 participants - always side by side if enough space */
        //   &:has(> :nth-child(2):last-child) > * {
        //     @container (min-width: 600px) {
        //       flex-basis: calc(50% - var(--j-space-500) / 2);
        //       max-width: calc(50% - var(--j-space-500) / 2);
        //     }
        //   }

        //   /* Optimize for 3-4 participants - 2×2 grid if enough space */
        //   &:has(> :nth-child(3)),
        //   &:has(> :nth-child(4):last-child) {
        //     @container (min-width: 600px) {
        //       & > * {
        //         flex-basis: calc(50% - var(--j-space-500) / 2);
        //         max-width: calc(50% - var(--j-space-500) / 2);
        //       }
        //     }
        //   }

        //   /* For 5-6 participants - 3×2 grid if enough space */
        //   &:has(> :nth-child(5)),
        //   &:has(> :nth-child(6):last-child) {
        //     @container (min-width: 900px) {
        //       & > * {
        //         flex-basis: calc(33.33% - var(--j-space-500) * 2 / 3);
        //         max-width: calc(33.33% - var(--j-space-500) * 2 / 3);
        //       }
        //     }
        //   }
        // }

        .footer {
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

<!-- async function registerWebcomponent() {
  const generatedName = await generateWCName("@coasys/flux-webrtc-view");

  if (!customElements.get(generatedName)) {
    const module = await fetchFluxApp("@coasys/flux-webrtc-view");
    if (module?.default) {
      try {
        await customElements.define(generatedName, module.default);
      } catch (e) {
        console.error(`Failed to define custom element ${generatedName}:`, e);
      }
    }
  }

  webcomponentName.value = generatedName;
} -->
