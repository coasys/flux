<template>
  <div class="call-container-wrapper" :class="{ mobile: isMobile }">
    <div
      v-if="isMobile"
      class="widgets-drawer"
      :class="{ open: widgetsDrawerOpen }"
      :style="{ height: `${callWidgetsHeight + 60}px` }"
    >
      <button class="drawer-handle" @click="toggleWidgetsDrawer" aria-label="Toggle call widgets">
        <ChevronDownIcon v-if="widgetsDrawerOpen" />
        <ChevronUpIcon v-else />
      </button>
      <CallWidgets :callRouteData="callRouteData" />
    </div>
    <CallWidgets v-else :callRouteData="callRouteData" />
    <div class="call-window-wrapper" :class="{ open: callWindowOpen }">
      <CallWindow :callRouteData="callRouteData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CallWidgets from '@/components/call/widgets/CallWidgets.vue';
import CallWindow from '@/components/call/window/CallWindow.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import ChevronUpIcon from '@/components/icons/ChevronUpIcon.vue';
import { ChannelData } from '@/composables/useCommunityService';
import { useCommunityServiceStore, useUiStore, useWebrtcStore } from '@/stores';
import { restoreChannelPrefix, restoreNeighbourhoodPrefix, stripChannelPrefix } from '@/utils/routeUtils';
import { Channel, Community } from '@coasys/flux-api';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();
const communityServiceStore = useCommunityServiceStore();

const { callRoute } = storeToRefs(webrtcStore);
const { isMobile, callWindowOpen, callWidgetsHeight } = storeToRefs(uiStore);

const widgetsDrawerOpen = ref(false);

function toggleWidgetsDrawer() {
  widgetsDrawerOpen.value = !widgetsDrawerOpen.value;
}

const callRouteData = computed(() => {
  const communityId = callRoute.value.communityId || (route.params.communityId as string);
  const channelId = callRoute.value.channelId || (route.params.channelId as string);
  const communityUrl = restoreNeighbourhoodPrefix(communityId);
  const channelUrl = restoreChannelPrefix(channelId);
  const communityService = communityServiceStore.getCommunityService(communityUrl);

  const communityName = (communityService?.community as Community | undefined)?.name || '';
  const allChannels = (communityService?.allChannels || []) as Channel[];
  const channel = allChannels.find((c) => c.id === channelUrl);

  if (!channel) return { communityName, channelName: '', conversationName: '' };

  if (channel.isConversation) {
    const channelsWithConversations = (communityService?.channelsWithConversations || []) as ChannelData[];
    const recentConversations = (communityService?.recentConversations || []) as ChannelData[];

    const parentChannel = channelsWithConversations.find((c) =>
      c.children?.some((child) => child.channel.id === channelUrl),
    );
    const conversationData = recentConversations?.find((c) => c.channel.id === channelUrl);

    const channelName = parentChannel?.channel.name || '';
    const conversationName = conversationData?.conversation?.conversationName || '';

    return { communityName, channelName, conversationName };
  }

  return { communityName, channelName: channel.name || '', conversationName: '' };
});
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

.call-container-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  bottom: 0;

  .call-window-wrapper {
    width: 100%;
    pointer-events: none;
  }

  &.mobile {
    .widgets-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: #1c1a1f;
      transform: translateY(calc(100% - 40px)); // Show only handle by default
      transition: transform 0.3s ease-in-out;
      z-index: 1001;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;

      &.open {
        transform: translateY(0); // Slide up fully when open
      }

      .drawer-handle {
        all: unset;
        width: 100%;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        border-top: 1px solid var(--j-color-ui-200);

        svg {
          width: 20px;
          height: 20px;
          color: var(--j-color-ui-300);
        }
      }
    }

    .call-window-wrapper {
      transform: translateY(100%); // Start off-screen
      transition: transform 0.3s ease-in-out;
      z-index: 1000;
      margin-bottom: 40px;

      &.open {
        pointer-events: auto;
        transform: translateY(0); // Slide in when open
      }
    }
  }
}
</style>
