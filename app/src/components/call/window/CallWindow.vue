<template>
  <div ref="rightSection" class="call-window-panel" :style="{ backgroundColor: isMobile ? '#1c1a1f' : 'transparent' }">
    <div
      ref="callWindow"
      :class="['call-window', { open: callWindowOpen }]"
      :style="{
        width: isMobile ? '100%' : `${callWindowOpen ? callWindowWidth : 0}px`,
        pointerEvents: callWindowOpen ? 'auto' : 'none',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        padding: isMobile ? 'var(--j-space-300)' : callWindowOpen ? 'var(--j-space-500)' : '0',
      }"
      :aria-hidden="!callWindowOpen"
    >
      <CallResizeHandle v-if="!isMobile" @start-resize="startResize" />

      <!-- Header -->
      <div class="call-window-header" :style="{ marginBottom: isMobile ? 'var(--j-space-300)' : 'var(--j-space-400)' }">
        <j-flex direction="column" gap="300">
          <j-text nomargin size="400">
            <b>{{ callRouteData.communityName }}</b>
            <template v-if="callRouteData.channelName"> / #{{ callRouteData.channelName }}</template>
            <template v-if="callRouteData.conversationName"> / {{ callRouteData.conversationName }}</template>
          </j-text>

          <j-flex v-if="!isMobile && agentsInCall.length" a="center" gap="100" style="margin-left: -6px">
            <AvatarGroup :users="agentsInCall" size="xs" />
            <j-text size="400" nomargin color="ui-500">{{
              `${agentsInCall.length} agent${agentsInCall.length > 1 ? 's' : ''} in the call`
            }}</j-text>
          </j-flex>
        </j-flex>

        <button
          class="close-button"
          @click="closeCallWindow"
          aria-label="Close call window"
          :style="{ width: isMobile ? '20px' : '26px', height: isMobile ? '20px' : '26px' }"
        >
          <j-icon name="x" color="color-white" />
        </button>
      </div>

      <!-- Content -->
      <div class="call-window-content" :class="{ mobile: isMobile, 'landscape-mobile': isLandscapeMobile }">
        <template v-if="isLandscapeMobile">
          <VideoGrid />

          <div
            style="
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: var(--j-space-500);
            "
          >
            <!-- Join prompt -->
            <j-box v-if="!inCall" mb="500">
              <j-flex direction="column" a="center" gap="300">
                <j-text size="700" nomargin style="text-align: center">You haven't joined this room</j-text>
                <j-text size="500" nomargin>Your microphone will be enabled.</j-text>
              </j-flex>
            </j-box>

            <JoinCallControls v-if="!inCall" />
            <MainCallControls v-if="inCall" />

            <j-button v-if="!inCall" @click="webrtcStore.copyCallLink" size="lg">
              <j-icon
                :name="hasCopiedLink ? 'clipboard-check' : 'link-45deg'"
                :style="{
                  '--j-icon-size': hasCopiedLink ? '1.5em' : '1.9em',
                  margin: hasCopiedLink ? '0 -5px 0 0' : '0 -5px -3px 0',
                }"
              />
              Copy Call Invite Link
            </j-button>
          </div>
        </template>

        <template v-else>
          <!-- Join prompt -->
          <j-box v-if="!inCall" mb="500">
            <j-flex direction="column" a="center" gap="300">
              <j-text size="700" nomargin style="text-align: center">You haven't joined this room</j-text>
              <j-text size="500" nomargin>Your microphone will be enabled.</j-text>
            </j-flex>
          </j-box>

          <VideoGrid />
          <JoinCallControls v-if="!inCall" />
          <MainCallControls v-if="inCall" />

          <j-button v-if="!inCall" @click="webrtcStore.copyCallLink" size="lg">
            <j-icon
              :name="hasCopiedLink ? 'clipboard-check' : 'link-45deg'"
              :style="{
                '--j-icon-size': hasCopiedLink ? '1.5em' : '1.9em',
                margin: hasCopiedLink ? '0 -5px 0 0' : '0 -5px -3px 0',
              }"
            />
            Copy Call Invite Link
          </j-button>
        </template>
      </div>

      <!-- Footer -->
      <div class="call-window-footer" v-if="!inCall && !isLandscapeMobile">
        <div class="disclaimer">
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
import AvatarGroup from '@/components/avatar-group/AvatarGroup.vue';
import { useUiStore, useWebrtcStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useCallResize } from '../composables/useCallResize';
import JoinCallControls from '../controls/JoinCallControls.vue';
import MainCallControls from '../controls/MainCallControls.vue';
import CallResizeHandle from './CallResizeHandle.vue';
import VideoGrid from './VideoGrid.vue';

defineProps<{
  callRouteData: {
    communityName: string;
    channelName: string;
    conversationName: string;
  };
}>();

const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { callWindowWidth, callWindowOpen, isMobile, isLandscapeMobile } = storeToRefs(uiStore);
const { agentsInCall, inCall, hasCopiedLink } = storeToRefs(webrtcStore);

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
  height: 100%;
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
    background-color: #1c1a1f;
    transition: all 0.5s ease-in-out;
    transition-property: opacity, width, transform;
    opacity: 0;
    padding: 0;

    &.open {
      opacity: 1;
    }

    .call-window-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .close-button {
        all: unset;
        cursor: pointer;
        border-radius: 50%;
        background-color: var(--j-color-ui-200);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 5;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: var(--j-color-ui-300);
        }
      }
    }

    .call-window-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: calc(100% - 120px);
      gap: var(--j-space-500);

      &.mobile {
        padding: var(--j-space-300);
        height: calc(100% - 28px);
        gap: var(--j-space-300);
      }

      &.landscape-mobile {
        flex-direction: row;

        :deep(.media-player) {
          width: auto;
          max-height: calc(100vh - 100px);
        }
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
</style>
