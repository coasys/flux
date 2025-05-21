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
              <j-flex a="center">
                <div class="connection-icon">
                  <j-icon name="wifi" color="success-500" style="rotate: 45deg" />
                </div>
                <j-text color="success-500" nomargin> {{ connectiontext }} </j-text>
              </j-flex>
              <j-text nomargin size="400">
                <b>{{ communityName }}</b> / {{ channelName }}
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
              :name="`arrows-angle-${callWindowOpen ? 'contract' : 'expand'}`"
              color="ui-500"
              @click="() => uiStore.setCallWindowOpen(!callWindowOpen)"
            />
          </j-flex>
        </j-flex>
      </div>
    </div>

    <div class="right-section">
      <div
        class="call-window"
        :style="{ width: callWindowOpen ? callWindowWidth : 0, opacity: callWindowOpen ? 1 : 0 }"
      >
        <component
          v-if="ready && appStore.ad4mClient.agent"
          :is="webcomponentName"
          :perspective="perspective"
          :source="source"
          :agent="appStore.ad4mClient.agent"
          :appStore="appStore"
          :webrtcStore="webrtcStore"
          :getProfile="getCachedAgentProfile"
          :close="() => uiStore.setCallWindowOpen(false)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore, useUIStore } from "@/store";
import { useWebRTCStore } from "@/store/webrtc";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveProxy } from "@coasys/ad4m";
import { generateWCName } from "@coasys/flux-api";
import { AgentStatus, Profile } from "@coasys/flux-types";
import "@coasys/flux-webrtc-view";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUIStore();
const webrtcStore = useWebRTCStore();

const { communitySidebarWidth, callWindowOpen, callWindowWidth } = storeToRefs(uiStore);
const { audioEnabled, videoEnabled, callRoute, communityName, channelName, preliminaryCallRoute, agentStatus } =
  storeToRefs(webrtcStore);

const myProfile = ref<Profile | null>(null);
const webcomponentName = ref("");
const perspective = shallowRef<PerspectiveProxy>();
const source = ref("");
const ready = ref(false);
const showAgentStatusMenu = ref(false);

const agentStatuses = ["active", "asleep", "busy", "invisible"] as AgentStatus[];

const connectiontext = computed(() => {
  if (audioEnabled.value && videoEnabled.value) return "Video connected";
  else if (audioEnabled.value) return "Voice connected";
  return "Connected";
});

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

async function getPerspective() {
  console.log("******** getting new call perspective");
  // Get the community perspective
  const communityId = route.params.communityId as string;
  perspective.value = (await appStore.ad4mClient.perspective.byUUID(communityId)) as PerspectiveProxy;

  // Set the channel ID as the source
  source.value = route.params.channelId as string;

  // Set the preliminary call route in the webrtc store
  console.log("setting preliminary call route", route.params);
  preliminaryCallRoute.value = route.params;

  // Mark the component as ready
  if (!ready.value) ready.value = true;
}

function profileClick() {
  router.push({ name: "home", params: { did: appStore.me.did } });
}

onMounted(async () => {
  getMyProfile();
  registerWebcomponent();
});

watch(
  () => route.params.communityId,
  (newCommunityId, oldCommunityId) => {
    if (!callRoute.value && newCommunityId && newCommunityId !== oldCommunityId) getPerspective();
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
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
        margin: 0 5px 0 -7px;

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
      pointer-events: auto;
      height: 100%;
      background-color: #1c1a1f; // var(--j-color-ui-100);
      transition: all 0.5s ease-in-out;
    }
  }
}
</style>
