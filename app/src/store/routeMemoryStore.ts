import { RouteParams } from "@coasys/flux-types";
import { defineStore } from "pinia";
import { ref } from "vue";

interface CommunityRouteMemory {
  path: string;
  params: RouteParams;
  channels: Record<string, string>; // Stores last viewId visited in each channel
}

export const useRouteMemoryStore = defineStore("routeMemoryStore", () => {
  // Map of last routes by community ID
  const lastRoutes = ref<Record<string, CommunityRouteMemory>>({});

  // Save the last full route visited in a community
  function saveLastRoute(communityId: string, path: string, params: RouteParams) {
    lastRoutes.value[communityId] = { ...lastRoutes.value[communityId], path, params };
  }

  // Save the last view visited in a channel
  function saveLastChannelView(communityId: string, channelId: string, viewId: string) {
    if (lastRoutes.value[communityId]) {
      lastRoutes.value[communityId].channels = lastRoutes.value[communityId].channels || {};
      lastRoutes.value[communityId].channels[channelId] = viewId;
    }
  }

  function getLastRoute(communityId: string) {
    return lastRoutes.value[communityId] || undefined;
  }

  function getLastChannelView(communityId: string, channelId: string) {
    return lastRoutes.value[communityId]?.channels?.[channelId] || undefined;
  }

  return {
    lastRoutes,
    saveLastRoute,
    saveLastChannelView,
    getLastRoute,
    getLastChannelView,
  };
});
