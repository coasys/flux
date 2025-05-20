import { useAppStore } from "@/store";
import { PerspectiveProxy } from "@coasys/ad4m";
import { Channel } from "@coasys/flux-api";
import { WebRTC } from "@coasys/flux-react-web";
import { AgentStatus, RouteParams } from "@coasys/flux-types";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";

export const useWebRTCStore = defineStore("webrtc", () => {
  const route = useRoute();
  const appStore = useAppStore();

  const instance = ref<WebRTC | undefined>();
  const preliminaryCallRoute = ref<RouteParams | null>();
  const callRoute = ref<RouteParams | null>(null);
  const communityName = ref("");
  const channelName = ref("");
  const audioEnabled = ref(true);
  const videoEnabled = ref(false);
  const agentStatus = ref<AgentStatus>("active");

  async function joinRoom(webRTC: WebRTC) {
    instance.value = webRTC;
    instance.value.onJoin({});

    const communityId = route.params.communityId as string;
    const perspective = (await appStore.ad4mClient.perspective.byUUID(communityId)) as PerspectiveProxy;
    const channels = await Channel.findAll(perspective, { where: { base: route.params.channelId! } });

    console.log("join room!", preliminaryCallRoute.value);
    // Todo: fix loading state in UI so this timeout is not needed
    setTimeout(() => {
      callRoute.value = preliminaryCallRoute.value!; // route.params as RouteParams;
      communityName.value = perspective.name || "";
      channelName.value = channels[0]?.name || "";
    }, 100);
  }

  function leaveRoom() {
    instance.value?.onLeave();
    instance.value = undefined;
    callRoute.value = null;
  }

  function toggleAudio() {
    instance.value?.onToggleAudio(!audioEnabled.value);
    audioEnabled.value = !audioEnabled.value;
  }

  function toggleVideo() {
    instance.value?.onToggleCamera(!videoEnabled.value);
    videoEnabled.value = !videoEnabled.value;
  }

  // watch(
  //   instance,
  //   async (newInstance) => {
  //     console.log("instance", newInstance);
  //   },
  //   { deep: true }
  // );

  return {
    instance,
    preliminaryCallRoute,
    callRoute,
    communityName,
    channelName,
    videoEnabled,
    audioEnabled,
    agentStatus,

    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
  };
});
