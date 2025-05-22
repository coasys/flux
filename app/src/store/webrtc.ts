import { useAppStore } from "@/store";
import { WebRTC } from "@coasys/flux-react-web";
import { AgentStatus, RouteParams } from "@coasys/flux-types";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";

export const useWebRTCStore = defineStore("webrtc", () => {
  const route = useRoute();
  const instance = ref<WebRTC | undefined>();
  const preliminaryCallRoute = ref<RouteParams | null>();
  const callRoute = ref<RouteParams | null>(null);
  const audioEnabled = ref(true);
  const videoEnabled = ref(false);
  const agentStatus = ref<AgentStatus>("active");
  const communityServices = ref<Record<string, any>>({});

  async function addInstance(webRTC: WebRTC) {
    instance.value = webRTC;
  }

  async function joinRoom() {
    instance.value?.onJoin({});

    // // Todo: fix loading state in UI so this timeout is not needed
    setTimeout(() => {
      callRoute.value = route.params as RouteParams; // route.params as RouteParams;
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

  return {
    instance,
    preliminaryCallRoute,
    callRoute,
    videoEnabled,
    audioEnabled,
    agentStatus,
    communityServices,

    addInstance,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
  };
});
