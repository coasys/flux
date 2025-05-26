<template>
  <div class="wrapper">
    <div class="left-section" :style="{ width: `calc(${communitySidebarWidth}px + 100px)` }">
      <div class="controls">
        <j-flex v-if="callRoute" direction="column">
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
                <b>{{ community?.name || "No community name" }}</b> / {{ channel?.name || "No channel name" }}
              </j-text>
            </j-flex>

            <j-flex a="center" gap="500">
              <j-icon :name="`mic${audioEnabled ? '' : '-mute'}`" color="ui-500" @click="webrtcStore.toggleAudio" />
              <j-icon
                :name="`camera-video${videoEnabled ? '' : '-off'}`"
                color="ui-500"
                @click="webrtcStore.toggleVideo"
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
              v-if="callRoute || route.params.channelId"
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
              <b>{{ community?.name || "No community name" }}</b> / {{ channel?.name || "No channel name" }}
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

        <div v-if="ready" style="height: 100%">
          <component
            :is="webcomponentName"
            :perspective="perspective"
            :source="channelId"
            :agent="appStore.ad4mClient.agent"
            :appStore="appStore"
            :webrtcStore="webrtcStore"
            :uiStore="uiStore"
            :getProfile="getCachedAgentProfile"
          />
        </div>

        <div class="disclaimer" v-if="!callRoute">
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
import { useCommunityServiceStore } from "@/stores/communityServiceStore";
import { useWebrtcStore } from "@/stores/webrtcStore";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveProxy } from "@coasys/ad4m";
import { Channel, Community, generateWCName } from "@coasys/flux-api";
import { AgentState, AgentStatus, CallHealth, Profile, SignallingService } from "@coasys/flux-types";
import "@coasys/flux-webrtc-view";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();
const communityServiceStore = useCommunityServiceStore();

const { communitySidebarWidth, callWindowOpen, callWindowWidth } = storeToRefs(uiStore);
const { audioEnabled, videoEnabled, callRoute, agentStatus } = storeToRefs(webrtcStore);

const agentStatuses = ["active", "asleep", "busy", "invisible"] as AgentStatus[];

const perspective = shallowRef<PerspectiveProxy>();
const communityId = ref("");
const channelId = ref("");
const myProfile = ref<Profile | null>(null);
const webcomponentName = ref("");
const ready = ref(false);
const showAgentStatusMenu = ref(false);

// TODO: move this into webrtcStore & access the signalling service there...
const agentsInCall = ref<AgentState[]>([]);

const communityService = computed(() => communityServiceStore.getCommunityService(communityId.value));
const signallingService = computed<SignallingService | undefined>(() => communityService.value?.signallingService);
const agents = computed<Record<string, AgentState>>(() => signallingService.value?.agents || {});
const callHealth = computed(() => signallingService.value?.callHealth || ("healthy" as CallHealth));
const callHealthColour = computed(findHealthColour);
const community = computed(() => communityService.value?.community || null) as ComputedRef<Community | null>;
const channel = computed(() =>
  (communityService.value?.channels as any).find((c: Channel) => c.baseExpression === channelId.value)
);
const connectionText = computed(findConnectionText);
const connectionWarning = computed(findConnectionWarning);

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

function findConnectionText() {
  if (videoEnabled.value) return "Video connected";
  else if (audioEnabled.value) return "Voice connected";
  return "Connected";
}

function findConnectionWarning() {
  if (callHealth.value === "healthy") return "";
  else if (callHealth.value === "warnings") return "(unstable)";
  else if (callHealth.value === "connections-lost") return "(lost peers)";
  return "";
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

async function getMyProfile() {
  myProfile.value = await getCachedAgentProfile(appStore.me.did);
}

async function registerWebcomponent() {
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
}

async function getData() {
  // ready.value = false;

  // Update the route data
  communityId.value = route.params.communityId as string;
  channelId.value = route.params.channelId as string;

  // Update the perspective
  perspective.value = (await appStore.ad4mClient.perspective.byUUID(communityId.value)) as PerspectiveProxy;

  ready.value = true;
}

function profileClick() {
  router.push({ name: "home", params: { did: appStore.me.did } });
}

onMounted(async () => {
  getMyProfile();
  registerWebcomponent();
});

// Get new data or close window on route changes
watch(
  () => route.params,
  async (newParams) => {
    if (!callRoute.value) newParams.channelId ? getData() : uiStore.setCallWindowOpen(false);
  },
  { immediate: true }
);

// Close call window and update state when exiting calls
watch(
  callRoute,
  (newCallRoute) => {
    if (!newCallRoute) {
      // Close call window
      uiStore.setCallWindowOpen(false);
      // Fetch data for current route once closed
      setTimeout(getData, 500);
    }
  },
  { immediate: true }
);

// Update agentsInCall when signalling service agents change
watch(
  agents,
  async (newAgents) => {
    const agentsInCallMap = Object.entries(newAgents).filter(
      ([_, agent]) => agent.callRoute?.channelId === channelId.value
    );
    agentsInCall.value = await Promise.all(
      agentsInCallMap.map(async ([did, agent]) => ({ ...agent, ...(await getCachedAgentProfile(did)) }))
    );
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
