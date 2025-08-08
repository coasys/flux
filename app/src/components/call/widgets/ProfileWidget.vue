<template>
  <div class="user-profile-widget widget">
    <!-- Call Status Section (only shown when in call) -->
    <j-flex v-if="inCall" direction="column">
      <j-flex j="between" wrap>
        <j-box mb="300" mr="500">
          <j-tooltip placement="top" title="Go to call channel">
            <j-flex direction="column" gap="100" @click="goToCallChannel" style="cursor: pointer">
              <j-flex a="center" gap="200">
                <div class="connection-icon">
                  <j-icon name="wifi" :color="callHealthColour" style="rotate: 45deg" />
                </div>
                <j-text :color="callHealthColour" nomargin>{{ connectionText }}</j-text>
                <j-text v-if="connectionWarning" :color="callHealthColour" nomargin>
                  {{ connectionWarning }}
                </j-text>
              </j-flex>
              <j-text nomargin size="400">
                <b>{{ callRouteData.communityName }}</b>
                <template v-if="callRouteData.channelName"> / #{{ callRouteData.channelName }}</template>
                <template v-if="callRouteData.conversationName"> / {{ callRouteData.conversationName }}</template>
              </j-text>
            </j-flex>
          </j-tooltip>
        </j-box>

        <j-box mt="300">
          <QuickCallControls />
        </j-box>
      </j-flex>
    </j-flex>

    <!-- User Profile Section -->
    <j-flex j="between" a="center">
      <j-flex a="center" gap="300">
        <j-tooltip placement="top" title="Go to profile">
          <j-avatar
            :hash="me.did"
            :src="myProfile?.profileThumbnailPicture"
            @click="goToProfile"
            style="cursor: pointer"
          />
        </j-tooltip>

        <j-flex direction="column">
          <j-tooltip placement="top" title="Go to profile">
            <j-text nomargin weight="600" @click="goToProfile" style="cursor: pointer">
              {{ myProfile?.username }}
            </j-text>
          </j-tooltip>

          <AgentStatusSelector />
        </j-flex>
      </j-flex>

      <UserActions />
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { useAppStore, useMediaDevicesStore, useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRouter } from "vue-router";
import AgentStatusSelector from "../controls/AgentStatusSelector.vue";
import QuickCallControls from "../controls/QuickCallControls.vue";
import UserActions from "../controls/UserActions.vue";

defineProps<{
  callRouteData: {
    communityName: string;
    channelName: string;
    conversationName: string;
  };
}>();

const router = useRouter();
const appStore = useAppStore();
const webrtcStore = useWebrtcStore();
const mediaDeviceStore = useMediaDevicesStore();

const { me, myProfile } = storeToRefs(appStore);
const { inCall, callRoute, callHealth } = storeToRefs(webrtcStore);
const { mediaSettings } = storeToRefs(mediaDeviceStore);

const callHealthColour = computed(() => {
  if (callHealth.value === "healthy") return "success-500";
  else if (callHealth.value === "warnings") return "warning-500";
  return "danger-500";
});

const connectionWarning = computed(() => {
  if (callHealth.value === "healthy") return "";
  else if (callHealth.value === "warnings") return "(unstable)";
  else if (callHealth.value === "connections-lost") return "(lost peers)";
  return "";
});

const connectionText = computed(() => {
  if (mediaSettings.value.videoEnabled) return "Video connected";
  else if (mediaSettings.value.audioEnabled) return "Voice connected";
  return "Connected";
});

function goToProfile() {
  router.push({ name: "home", params: { did: me.value.did } });
}

function goToCallChannel() {
  router.push({ name: "view", params: callRoute.value });
}
</script>

<style scoped lang="scss">
.widget {
  pointer-events: auto;
  gap: var(--j-space-400);
  display: flex;
  flex-direction: column;
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
    cursor: pointer;
  }

  .connection-icon {
    height: 26px;
    margin-left: -7px;

    j-icon {
      --j-icon-size: 26px;
    }
  }
}
</style>
