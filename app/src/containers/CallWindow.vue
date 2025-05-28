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
                :name="`mic${mediaSettings.audio ? '' : '-mute'}`"
                color="ui-500"
                @click="mediaDeviceStore.toggleAudio"
              />
              <j-icon
                :name="`camera-video${mediaSettings.video ? '' : '-off'}`"
                color="ui-500"
                @click="mediaDeviceStore.toggleVideo"
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
                  <div class="agent-status" :class="agentStatus" />
                  <j-text nomargin size="300">{{ agentStatus }}</j-text>
                </j-flex>

                <j-menu slot="content">
                  <j-menu-item
                    v-for="status in agentStatuses"
                    @click="
                      agentStatus = status;
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
        :style="{ width: callWindowOpen ? callWindowWidth : 0, opacity: callWindowOpen ? 1 : 0 }"
      >
        <div class="resize-handle" @mousedown="startResize" />
        <j-flex j="between">
          <j-flex direction="column" gap="300">
            <j-text nomargin size="400">
              <b>{{ callCommunityName }}</b> / {{ callChannelName }}
            </j-text>

            <j-flex a="center" gap="100" v-if="agentsInCall.length" style="margin-left: -6px">
              <AvatarGroup :users="agentsInCall" size="xs" />
              <j-text size="400" nomargin color="ui-500">{{
                `${agentsInCall.length} agent${agentsInCall.length > 1 ? "s" : ""} in the call`
              }}</j-text>
            </j-flex>
          </j-flex>

          <button class="close-button" @click="() => uiStore.setCallWindowOpen(false)">
            <j-icon name="x" color="color-white" />
          </button>
        </j-flex>

        <div style="display: flex; flex-direction: column; justify-content: center; height: 100%">
          <!-- Join screen -->
          <j-flex a="center" direction="column">
            <h1>You haven't joined this room</h1>

            <j-text variant="body">Your microphone will be enabled.</j-text>

            <j-box pt="200" style="width: 100%">
              <div class="preview">
                <video
                  class="video"
                  :style="{ opacity: mediaSettings.video ? 1 : 0 }"
                  :srcObject.prop="stream"
                  :muted="!mediaSettings.audio"
                  autoplay
                  playsinline
                />

                <div class="avatar-wrapper" v-if="myProfile && !mediaSettings.video">
                  <j-avatar
                    :initials="myProfile?.username?.charAt(0) || '?'"
                    size="xl"
                    :src="myProfile?.profileThumbnailPicture || null"
                    :hash="me.did"
                  />
                </div>

                <div class="username">
                  <span
                    >{{ myProfile?.username || "Unknown user" }}
                    {{ mediaSettings.video ? "video on" : "video off" }}</span
                  >
                </div>

                <div class="settings">
                  <j-flex gap="400">
                    <j-tooltip placement="top" title="Settings">
                      <j-button @click="toggleSettings" square circle size="lg">
                        <j-icon name="gear" />
                      </j-button>
                    </j-tooltip>
                    <j-tooltip placement="top" :title="callWindowOpen ? 'Shrink screen' : 'Full screen'">
                      <j-button @click="() => uiStore.setCallWindowOpen(false)" square circle size="lg">
                        <j-icon :name="`arrows-angle-${callWindowOpen ? 'contract' : 'expand'}`" />
                      </j-button>
                    </j-tooltip>
                  </j-flex>
                </div>
              </div>
            </j-box>

            <j-box pt="400">
              <j-toggle :checked="mediaSettings.video" @change="() => mediaDeviceStore.toggleVideo()">
                Join with camera!
              </j-toggle>
            </j-box>

            <j-box pt="500">
              <j-button
                variant="primary"
                size="lg"
                :disabled="!mediaSettings.audio && !mediaSettings.video"
                :loading="establishingConnection"
                @click="webrtcStore.joinRoom"
              >
                Join room!
              </j-button>
            </j-box>

            <j-box v-if="!mediaSettings.audio && !mediaSettings.video" pt="400">
              <j-text color="warning-500">Please allow camera/microphone access to join.</j-text>
            </j-box>
          </j-flex>
        </div>

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
</template>

<script setup lang="ts">
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { useAppStore, useUiStore } from "@/stores";
import { useMediaDevicesStore } from "@/stores/mediaDevicesStore";
import { useWebrtcStore } from "@/stores/webrtcStore";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { AgentStatus, Profile } from "@coasys/flux-types";
import "@coasys/flux-webrtc-view";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();
const mediaDeviceStore = useMediaDevicesStore();

const { me } = storeToRefs(appStore);
const { communitySidebarWidth, callWindowOpen, callWindowWidth } = storeToRefs(uiStore);
const {
  inCall,
  callRoute,
  callHealth,
  agentsInCall,
  callCommunityName,
  callChannelName,
  agentStatus,
  establishingConnection,
} = storeToRefs(webrtcStore);
const { stream, mediaSettings } = storeToRefs(mediaDeviceStore);

const agentStatuses = ["active", "asleep", "busy", "invisible"] as AgentStatus[];

const myProfile = ref<Profile | null>(null);
const showAgentStatusMenu = ref(false);

const callHealthColour = computed(findHealthColour);
const connectionWarning = computed(findConnectionWarning);
const connectionText = computed(findConnectionText);

const callWindow = ref<HTMLElement | null>(null);
const rightSection = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const startWidth = ref(0);

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
  if (mediaSettings.value.video) return "Video connected";
  else if (mediaSettings.value.audio) return "Voice connected";
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
  const minWidth = rightSection.value?.getBoundingClientRect().width / 3 || 0;
  const newWidth = startWidth.value + (startX.value - e.clientX);
  console.log("minWidth", minWidth);
  uiStore.setCallWindowWidth(`${Math.max(minWidth, newWidth)}px`);
}

function stopResize() {
  if (!callWindow.value) return;
  isDragging.value = false;

  // Reset the transition styles and remove the global resizing class
  const channelView = document.getElementById("channel-view");
  if (channelView) channelView.style.transition = "width 0.5s ease-in-out";
  callWindow.value.style.transition = "all 0.5s ease-in-out";
  document.body.classList.remove("text-selection-disabled");

  // Remove event listeners for mousemove and mouseup
  document.removeEventListener("mousemove", doResize);
  document.addEventListener("mouseup", stopResize, false);
}

function toggleSettings() {
  console.log("toggle settings!");
}

// TODO: store my profile in the app store
async function getMyProfile() {
  myProfile.value = await getCachedAgentProfile(me.value.did);
}

function profileClick() {
  router.push({ name: "home", params: { did: me.value.did } });
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

      .preview {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
        max-height: 80vh;
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

        .avatar-wrapper {
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
