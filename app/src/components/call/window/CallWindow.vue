<template>
  <div ref="rightSection" class="call-window-panel">
    <div
      ref="callWindow"
      class="call-window"
      :style="{ width: `${callWindowWidth}px`, opacity: callWindowOpen ? 1 : 0 }"
    >
      <CallResizeHandle @start-resize="startResize" />

      <!-- Header -->
      <div class="call-window-header">
        <j-flex direction="column" gap="300">
          <j-text nomargin size="400">
            <b>{{ callRouteData.communityName }}</b>
            <template v-if="callRouteData.channelName"> / #{{ callRouteData.channelName }}</template>
            <template v-if="callRouteData.conversationName"> / {{ callRouteData.conversationName }}</template>
          </j-text>

          <j-flex v-if="agentsInCall.length" a="center" gap="100" style="margin-left: -6px">
            <AvatarGroup :users="agentsInCall" size="xs" />
            <j-text size="400" nomargin color="ui-500">{{
              `${agentsInCall.length} agent${agentsInCall.length > 1 ? "s" : ""} in the call`
            }}</j-text>
          </j-flex>
        </j-flex>

        <button class="close-button" @click="closeCallWindow">
          <j-icon name="x" color="color-white" />
        </button>
      </div>

      <!-- Content -->
      <div class="call-window-content">
        <!-- Join prompt -->
        <j-box v-if="!inCall" mb="500">
          <j-flex direction="column" a="center" gap="300">
            <j-text size="800" nomargin>You haven't joined this room</j-text>
            <j-text size="500" nomargin>Your microphone will be enabled.</j-text>
          </j-flex>
        </j-box>

        <VideoGrid />
        <JoinCallControls v-if="!inCall" />
        <MainCallControls v-if="inCall" />
      </div>

      <!-- Footer -->
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
</template>

<script setup lang="ts">
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { useUiStore, useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useCallResize } from "../composables/useCallResize";
import JoinCallControls from "../controls/JoinCallControls.vue";
import MainCallControls from "../controls/MainCallControls.vue";
import CallResizeHandle from "./CallResizeHandle.vue";
import VideoGrid from "./VideoGrid.vue";

defineProps<{
  callRouteData: {
    communityName: string;
    channelName: string;
    conversationName: string;
  };
}>();

const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { callWindowWidth, callWindowOpen } = storeToRefs(uiStore);
const { agentsInCall, inCall } = storeToRefs(webrtcStore);

const rightSection = ref<HTMLElement | null>(null);
const callWindow = ref<HTMLElement | null>(null);

const { startResize } = useCallResize(callWindow, rightSection);

function closeCallWindow() {
  uiStore.setCallWindowOpen(false);
}
</script>

<style scoped lang="scss">
.call-window-panel {
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
    background-color: #1c1a1f;
    transition: all 0.5s ease-in-out;

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
</style>
