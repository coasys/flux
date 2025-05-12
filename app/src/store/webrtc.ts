import { WebRTC } from "@coasys/flux-react-web";
import { RouteParams } from "@coasys/flux-types";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";

export const useWebRTCStore = defineStore("webrtc", () => {
  const route = useRoute();

  const instance = ref<WebRTC | undefined>();
  const callRoute = ref<RouteParams | null>(null);

  function joinRoom(webRTC: WebRTC) {
    instance.value = webRTC;
    instance.value.onJoin({});

    // Todo: fix loading state in UI so this timeout is not needed
    setTimeout(() => {
      callRoute.value = route.params as RouteParams;
    }, 100);
  }

  function leaveRoom() {
    instance.value?.onLeave();
    instance.value = undefined;
    callRoute.value = null;
  }

  return { instance, callRoute, joinRoom, leaveRoom };
});
