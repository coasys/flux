import { RouteParams } from "@coasys/flux-types";
import { defineStore } from "pinia";
import { ref } from "vue";

interface CommunityRouteMemory {
  path: string;
  params: RouteParams;
  channels: Record<string, string>; // Stores last viewId visited in each channel
}

export const useRouteMemoryStore = defineStore(
  "routeMemoryStore",
  () => {
    const currentRoute = ref<RouteParams>({});
    const lastCommunityRoutes = ref<Record<string, CommunityRouteMemory>>({});

    function setCurrentRoute(params: RouteParams) {
      currentRoute.value = params;
    }

    function setLastCommunityRoute(communityId: string, path: string, params: RouteParams) {
      // Saves the last full route visited in a community
      lastCommunityRoutes.value[communityId] = { ...lastCommunityRoutes.value[communityId], path, params };
    }

    function setLastChannelView(communityId: string, channelId: string, viewId: string) {
      // Saves the last view visited in a channel
      if (lastCommunityRoutes.value[communityId]) {
        lastCommunityRoutes.value[communityId].channels = lastCommunityRoutes.value[communityId].channels || {};
        lastCommunityRoutes.value[communityId].channels[channelId] = viewId;
      }
    }

    function getLastCommunityRoute(communityId: string) {
      return lastCommunityRoutes.value[communityId] || undefined;
    }

    function getLastChannelView(communityId: string, channelId: string) {
      return lastCommunityRoutes.value[communityId]?.channels?.[channelId] || undefined;
    }

    return {
      currentRoute,
      setCurrentRoute,
      setLastCommunityRoute,
      setLastChannelView,
      getLastCommunityRoute,
      getLastChannelView,
    };
  },
  { persist: false }
);
