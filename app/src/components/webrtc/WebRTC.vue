<!-- <template>
  <div class="webrtc-component" v-if="webrtcStore.isInCall">
    <div class="call-indicator">
      <div class="video-container">
        <video
          v-if="localStream && localStream.getVideoTracks().length > 0"
          ref="localVideo"
          class="local-video"
          autoplay
          muted
          playsinline
        ></video>

        <div v-for="peer in connections" :key="peer.did" class="remote-video">
          <video
            :ref="
              (el) => {
                if (el) setRemoteVideo(el, peer.did);
              }
            "
            autoplay
            playsinline
          ></video>
        </div>
      </div>

      <div class="controls">
        <button @click="toggleAudio" :class="{ active: isAudioEnabled }">
          <i class="icon" :class="isAudioEnabled ? 'icon-mic' : 'icon-mic-off'"></i>
        </button>

        <button @click="toggleVideo" :class="{ active: isVideoEnabled }">
          <i class="icon" :class="isVideoEnabled ? 'icon-video' : 'icon-video-off'"></i>
        </button>

        <button @click="toggleScreenShare" :class="{ active: isScreenSharing }">
          <i class="icon icon-screen-share"></i>
        </button>

        <button @click="leaveCall" class="leave-call"><i class="icon icon-call-end"></i> End Call</button>
      </div>
    </div>
  </div>
</template> -->

<template>
  <div class="wrapper">
    <div class="left-section" :style="{ width: `calc(${communitySidebarWidth}px + 100px)` }">
      <div class="controls">
        <j-flex v-if="callRoute" j="between" a="center">
          <j-text nomargin>In call: {{ callRoute.communityId }}</j-text>
        </j-flex>

        <j-flex j="between" a="center">
          <j-flex a="center" gap="300">
            <j-avatar :hash="appStore.me.did" :src="myProfile?.profileThumbnailPicture" />
            <j-text nomargin>{{ myProfile?.username }}</j-text></j-flex
          >

          <j-flex a="center" gap="400">
            <j-icon name="mic" color="ui-500" @click="" />
            <j-icon name="headset" color="ui-500" @click="" />
            <j-icon name="gear" color="ui-500" @click="" />
          </j-flex>
        </j-flex>
      </div>
    </div>

    <div class="right-section" style="width: 100%; position: relative; display: flex; justify-content: flex-end">
      <div class="call-window" v-if="!loading && showCallWindow" :style="{ width: callWindowWidth }">
        <!-- route.params.channelId -->
        <component
          :is="wcName"
          :perspective="perspective"
          :source="communityId"
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
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
// import WebRTCView from "@coasys/flux-webrtc-view";
import { PerspectiveProxy } from "@coasys/ad4m";
import "@coasys/flux-webrtc-view";
import { Channel, generateWCName, joinCommunity } from "@coasys/flux-api";
import fetchFluxApp from "@/utils/fetchFluxApp";

const props = defineProps({
  //   source: {
  //     type: String,
  //     required: true,
  //     default: "app-webrtc",
  //   },
  //   perspective: {
  //     type: Object,
  //     required: true,
  //   },
  //   agent: {
  //     type: Object,
  //     required: true,
  //   },
  //   autoJoin: {
  //     type: Boolean,
  //     default: false,
  //   },
});

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUIStore();
const webrtcStore = useWebRTCStore();

const { communitySidebarWidth, showCallWindow, callWindowWidth } = storeToRefs(uiStore);
const { callRoute } = storeToRefs(webrtcStore);

// const communityServiceRef = ref<CommunityService | null>(null);

const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideos = ref<{ [key: string]: HTMLVideoElement }>({});

// todo, update to be controlled by user
const communityId = route.params.communityId as string;

// // State for UI controls
// const isAudioEnabled = ref(true);
// const isVideoEnabled = ref(true);
// const isScreenSharing = ref(false);
const perspective = ref<PerspectiveProxy>();

// const perspective = ref<PerspectiveProxy | null>(null);

const myProfile = ref<Profile | null>(null);

// Initialize WebRTC service
// const webrtc = {} as any;
// const webrtc = useWebRTCService({
//   enabled: true,
//   source: "", // route.params.,
//   perspective: undefined, // props.perspective,
//   agent: props.agent,
//   events: {
//     onPeerJoin: (did) => console.log(`Peer joined: ${did}`),
//     onPeerLeave: (did) => {
//       console.log(`Peer left: ${did}`);
//       // Clean up removed peer videos
//       if (remoteVideos.value[did]) {
//         delete remoteVideos.value[did];
//       }
//     },
//   },
// });

// // Access reactive state
// const localStream = computed(() => webrtc.localStream?.value);
// const connections = computed(() => webrtc.connections?.value);

// // Handle updating video elements
// watch(localStream, (stream) => {
//   if (stream && localVideo.value) {
//     localVideo.value.srcObject = stream;
//   }
// });

// // Set remote video for a peer
// function setRemoteVideo(el: HTMLVideoElement, did: string) {
//   remoteVideos.value[did] = el;

//   // Find the connection for this peer
//   const connection = connections.value.find((c: any) => c.did === did);
//   if (connection && connection.connection.peer) {
//     // Get stream from peer connection
//     const stream = connection.connection.peer.streams?.[0];
//     if (stream) {
//       el.srcObject = stream;
//     }
//   }
// }

// // Call control functions
// function joinCall() {
//   webrtcStore.joinRoom(webrtc);
// }

// function leaveCall() {
//   webrtcStore.leaveRoom();
// }

// function toggleAudio() {
//   isAudioEnabled.value = !isAudioEnabled.value;
//   webrtc.onToggleAudio(isAudioEnabled.value);
// }

// function toggleVideo() {
//   isVideoEnabled.value = !isVideoEnabled.value;
//   webrtc.onToggleCamera(isVideoEnabled.value);
// }

// function toggleScreenShare() {
//   isScreenSharing.value = !isScreenSharing.value;
//   webrtc.onToggleScreenShare(isScreenSharing.value);

//   // When screen sharing ends, update the UI state
//   if (isScreenSharing.value && localStream.value) {
//     const videoTrack = localStream.value.getVideoTracks()[0];
//     if (videoTrack) {
//       videoTrack.onended = () => {
//         isScreenSharing.value = false;
//       };
//     }
//   }
// }

const loading = ref(true);
const wcName = ref<string>("");

onMounted(async () => {
  myProfile.value = await getCachedAgentProfile(appStore.me.did);
  perspective.value = (await appStore.ad4mClient.perspective.byUUID(communityId)) as PerspectiveProxy;
  console.log("perspective", perspective.value);

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

  wcName.value = generatedName;
  loading.value = false;
});

// onMounted(async () => {
//   console.log("*** view mounted", viewId);

//   const generatedName = await generateWCName(viewId as string);

//   if (!customElements.get(generatedName)) {
//     const module = await fetchFluxApp(viewId as string);
//     if (module?.default) {
//       try {
//         await customElements.define(generatedName, module.default);
//       } catch (e) {
//         console.error(`Failed to define custom element ${generatedName}:`, e);
//       }
//     }
//   }

//   wcName.value = generatedName;
//   loading.value = false;
// });

// // Auto-join or cleanup
// onMounted(() => {
//   if (props.autoJoin || route.query.join === "true") {
//     joinCall();
//   }
// });

// onUnmounted(() => {
//   if (webrtcStore.isInCall) {
//     leaveCall();
//   }
// });
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  width: 100%;
  height: 100%;

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
      z-index: 2;
      pointer-events: auto;
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
      }
    }
  }

  .call-window {
    z-index: 1;
    pointer-events: auto;
    height: 100%;
    background-color: var(--j-color-ui-100);
  }
}
</style>
