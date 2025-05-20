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

    <div class="right-section">
      <div
        class="call-window"
        v-if="!loading && appStore.ad4mClient.agent"
        :style="{ width: showCallWindow ? callWindowWidth : 0, opacity: showCallWindow ? 1 : 0 }"
      >
        <component
          :is="wcName"
          :perspective="perspective"
          :source="route.params.channelId"
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
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PerspectiveProxy } from "@coasys/ad4m";
import "@coasys/flux-webrtc-view";
import { Channel, generateWCName, joinCommunity } from "@coasys/flux-api";
import fetchFluxApp from "@/utils/fetchFluxApp";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const uiStore = useUIStore();
const webrtcStore = useWebRTCStore();

const { communitySidebarWidth, showCallWindow, callWindowWidth } = storeToRefs(uiStore);
const { callRoute } = storeToRefs(webrtcStore);

// todo, update to be controlled by user
const communityId = route.params.communityId as string;
const channelId = route.params.channelId as string;

// // State for UI controls
// const isAudioEnabled = ref(true);
// const isVideoEnabled = ref(true);
// const isScreenSharing = ref(false);
const perspective = shallowRef<PerspectiveProxy>();

// const perspective = ref<PerspectiveProxy | null>(null);

const myProfile = ref<Profile | null>(null);

const loading = ref(true);
const wcName = ref<string>("");

onMounted(async () => {
  myProfile.value = await getCachedAgentProfile(appStore.me.did);
  perspective.value = (await appStore.ad4mClient.perspective.byUUID(communityId)) as PerspectiveProxy;

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

  .right-section {
    width: 100%;
    position: relative;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;

    .call-window {
      z-index: 1;
      pointer-events: auto;
      height: 100%;
      background-color: #1c1a1f; // var(--j-color-ui-100);
      transition: all 0.5s ease-in-out;
    }
  }
}
</style>
