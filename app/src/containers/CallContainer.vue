<template>
  <div class="wrapper" :class="{ mobile: isMobile }">
    <CallWidgets :callRouteData="callRouteData" />
    <CallWindow :callRouteData="callRouteData" />
  </div>
</template>

<script setup lang="ts">
import CallWidgets from "@/components/call/widgets/CallWidgets.vue";
import CallWindow from "@/components/call/window/CallWindow.vue";
import { ChannelData } from "@/composables/useCommunityService";
import { useCommunityServiceStore, useUiStore, useWebrtcStore } from "@/stores";
import { Channel, Community } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();
const communityServiceStore = useCommunityServiceStore();

const { callRoute } = storeToRefs(webrtcStore);
const { isMobile } = storeToRefs(uiStore);

const callRouteData = computed(() => {
  const communityId = callRoute.value.communityId || (route.params.communityId as string);
  const channelId = callRoute.value.channelId || (route.params.channelId as string);
  const communityService = communityServiceStore.getCommunityService(communityId);

  const communityName = (communityService?.community as Community | undefined)?.name || "";
  const allChannels = (communityService?.allChannels || []) as Channel[];
  const channel = allChannels.find((c) => c.baseExpression === channelId);

  if (!channel) return { communityName, channelName: "", conversationName: "" };

  if (channel.isConversation) {
    const channelsWithConversations = (communityService?.channelsWithConversations || []) as ChannelData[];
    const recentConversations = (communityService?.recentConversations || []) as ChannelData[];

    const parentChannel = channelsWithConversations.find((c) =>
      c.children?.some((child) => child.channel.baseExpression === channelId)
    );
    const conversationData = recentConversations?.find((c) => c.channel.baseExpression === channelId);

    const channelName = parentChannel?.channel.name || "";
    const conversationName = conversationData?.conversation?.conversationName || "";

    return { communityName, channelName, conversationName };
  }

  return { communityName, channelName: channel.name || "", conversationName: "" };
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

.wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 20;

  &.mobile {
    flex-direction: column-reverse;
  }
}
</style>
