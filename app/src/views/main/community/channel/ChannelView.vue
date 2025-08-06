<template>
  <div id="channel-view" class="channel-view" v-if="channel">
    <div class="header">
      <div class="header-info">
        <button v-if="isMobile" class="open-sidebar-button" @click="() => uiStore.setCommunitySidebarOpen(true)">
          <ChevronLeft />
        </button>
        <j-flex
          a="center"
          @click="() => changeCurrentView(`conversation${channel?.isConversation ? '' : 's'}`)"
          style="cursor: pointer"
        >
          <j-icon
            :name="channel.isConversation ? 'flower2' : 'hash'"
            size="md"
            color="ui-300"
            :style="{ marginRight: channel.isConversation ? '10px' : '5px' }"
          />
          <j-text color="black" weight="700" size="500" nomargin>
            {{ channel.isConversation ? conversation?.conversationName || "" : channel.name }}
          </j-text>
        </j-flex>
      </div>

      <div class="header-buttons">
        <template v-if="!callWindowOpen && (!inCall || callRoute.channelId === channelId)">
          <j-button size="sm" variant="primary" :onClick="() => uiStore.setCallWindowOpen(true)">
            <j-icon size="sm" name="telephone" style="margin-right: -5px" />
            {{ `${inCall ? "Open call window" : agentsInCall.length ? "Join call" : "Start call"}` }}
          </j-button>

          <AvatarGroup
            v-if="agentsInCall.length"
            @click="() => uiStore.setCallWindowOpen(true)"
            :users="agentsInCall"
            :tooltip-title="`${agentsInCall.length} agent${agentsInCall.length > 1 ? 's' : ''} in the call`"
            size="xs"
          />
        </template>

        <button
          v-if="channel.isConversation"
          class="header-button"
          :class="channel.isPinned ? 'highlighted' : ''"
          @click="togglePinned"
        >
          <j-icon name="pin" size="sm" style="margin: 3px 7px 0 0" />
          {{ channel.isPinned ? "Pinned" : "Pin" }}
        </button>
        <!-- <button v-else class="header-button highlighted" @click="goToEditChannel">
          <j-icon name="pencil-square" size="sm" style="margin: 3px 7px 0 0" />
          Edit channel
        </button> -->
      </div>

      <div class="header-views">
        <label
          v-for="view in views"
          :class="{ tab: true, checked: view.pkg === viewId }"
          @click="() => changeCurrentView(view.pkg)"
        >
          <j-icon :name="view.icon" size="xs" />
          <span>{{ view.name }}</span>
        </label>

        <j-tooltip placement="auto" title="Manage views">
          <j-button v-if="sameAgent" @click="goToEditChannel" size="sm" variant="ghost">
            <j-icon size="md" name="plus" />
          </j-button>
        </j-tooltip>
      </div>
    </div>

    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['ViewView']" :max="10">
        <component
          v-if="route.params.communityId === communityId && route.params.channelId === channelId"
          :key="`${channelId}-${route.params.viewId}`"
          :is="Component"
          :channel="channel"
          class="perspective-view"
        />
      </KeepAlive>
    </RouterView>

    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e: any) => toggleProfile(e.target.open, activeProfile)"
    >
      <ProfileContainer :did="activeProfile" @openCompleteProfile="() => handleProfileClick(activeProfile)" />
    </j-modal>

    <j-modal size="xs" v-if="isJoiningCommunity" :open="isJoiningCommunity">
      <j-box p="500" a="center">
        <Hourglass width="30px" />
        <j-text variant="heading">Joining community</j-text>
        <j-text>Please wait...</j-text>
      </j-box>
    </j-modal>

    <j-modal size="xs" v-if="isChangeChannel" :open="isChangeChannel">
      <j-box pt="600" pb="800" px="400">
        <j-box pb="300">
          <j-text variant="heading-sm">Select a channel</j-text>
        </j-box>

        <label
          :class="{ 'tab-modal': true, checked: view.pkg === currentView }"
          v-for="view in views"
          @click="() => changeCurrentView(view.pkg)"
        >
          <input
            :name="channel?.baseExpression"
            type="radio"
            :checked.prop="view.pkg === currentView"
            :value.prop="view.pkg"
          />
          <j-icon :name="view.icon" size="xs" />
          <span>{{ view.name }}</span>
        </label>
      </j-box>
    </j-modal>
  </div>
</template>

<script setup lang="ts">
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import Hourglass from "@/components/hourglass/Hourglass.vue";
import ChevronLeft from "@/components/icons/ChevronLeft.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import ProfileContainer from "@/containers/Profile.vue";
import { useAppStore, useModalStore, useUiStore, useWebrtcStore } from "@/stores";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { App, Channel } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "ChannelView" });
const { communityId, channelId, viewId } = defineProps({
  communityId: { type: String },
  channelId: { type: String },
  viewId: { type: String },
});

const router = useRouter();
const route = useRoute();

const appStore = useAppStore();
const modalStore = useModalStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { perspective, allChannels, signallingService, recentConversations, getPinnedConversations } =
  useCommunityService();

const { me } = storeToRefs(appStore);
const { callWindowOpen } = storeToRefs(uiStore);
const { inCall, callRoute } = storeToRefs(webrtcStore);

const currentView = ref("");
const activeProfile = ref<string>("");
const showProfile = ref(false);
const isJoiningCommunity = ref(false);
const isChangeChannel = ref(false);

const channel = computed(() => allChannels.value.find((c) => c.baseExpression === channelId));
const conversation = computed(() =>
  channel.value?.isConversation
    ? recentConversations.value.find((c) => c.channel.baseExpression === channelId)?.conversation
    : null
);
const sameAgent = computed(() => channel.value?.author === me.value.did);
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 800);
const agentsInChannel = computed(() => signallingService?.getAgentsInChannel(channelId)?.value || []);
const agentsInCall = computed(() => signallingService?.getAgentsInCall(channelId)?.value || []);

const { entries: views } = useModel({ perspective, model: App, query: { source: channelId } });

function goToEditChannel() {
  modalStore.showEditChannel = true;
}

function changeCurrentView(viewId: string) {
  router.push({ name: "view", params: { communityId, channelId, viewId } });
}

function onIsChannelChange() {
  isChangeChannel.value = !isChangeChannel.value;
}

function onHideNotificationIndicator({ detail }: any) {
  const { channelId } = route.params;

  if (channelId) {
    // TODO: Set channel has new messages
    // dataStore.setHasNewMessages({
    //   communityId: route.params.communityId as string,
    //   channelId: channelId as string,
    //   value: false,
    // });
  }
}

function toggleProfile(open: boolean, did?: any): void {
  if (!open) activeProfile.value = "";
  else activeProfile.value = did;
  showProfile.value = open;
}

async function handleProfileClick(did: string) {
  activeProfile.value = did;
  if (did === me.value.did) router.push({ name: "home", params: { did } });
  else router.push({ name: "profile", params: { did, communityId } });
}

async function togglePinned() {
  if (!channel.value) return;

  try {
    const channelModel = new Channel(perspective, channel.value.baseExpression);
    channelModel.isPinned = !channel.value.isPinned;
    await channelModel.update();
  } catch (error) {
    console.error("Error toggling pinned state:", error);
    appStore.showDangerToast({ message: "Failed to update pinned state" });
  }
}

function updateWindowWidth() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => {
  // Add resize event listener to update window width
  window.addEventListener("resize", updateWindowWidth);

  // Navigate to the conversation or subchannels view if no viewId present when entering channel
  if (!viewId) {
    if (channel.value?.isConversation) router.push({ name: "view", params: { viewId: "conversation" } });
    else router.push({ name: "view", params: { viewId: "sub-channels" } });
  }
});

onUnmounted(() => {
  // Remove resize event listener
  window.removeEventListener("resize", updateWindowWidth);
});
</script>

<style scoped lang="scss">
.channel-view {
  position: relative;
  background: var(--app-channel-bg-color, transparent);
  width: 100%;
  height: 100vh;

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 0 var(--j-space-400);
    position: sticky;
    background: var(--app-channel-header-bg-color, transparent);
    border-bottom: 1px solid var(--app-channel-header-border-color, var(--j-border-color));
    min-height: var(--app-header-height);

    .open-sidebar-button {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      color: var(--j-color-ui-300);
      font-weight: 600;
      font-size: var(--j-font-size-400);

      > svg {
        width: 20px;
        height: 20px;
      }
    }

    .header-info,
    .header-buttons,
    .header-views {
      display: flex;
      align-items: center;
      height: var(--app-header-height);
      gap: var(--j-space-400);
      margin-right: var(--j-space-600);
    }

    .header-views {
      gap: var(--j-space-600);
      overflow-x: auto;
    }

    .header-button {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: var(--j-color-ui-500);
      font-size: var(--j-font-size-400);
      padding: 0 var(--j-space-300);
      border-radius: 8px;
      background: var(--j-color-ui-100);
      height: var(--j-size-sm);

      > j-icon {
        color: var(--j-color-ui-400);
      }

      &.highlighted {
        outline: 1px solid var(--j-color-primary-500);
        color: var(--j-color-primary-600);

        > j-icon {
          color: var(--j-color-primary-600);
        }
      }

      &:hover {
        color: var(--j-color-ui-600);

        > j-icon {
          color: var(--j-color-ui-500);
        }

        &.highlighted {
          outline: 1px solid var(--j-color-primary-600);
          color: var(--j-color-primary-700);

          > j-icon {
            color: var(--j-color-primary-700);
          }
        }
      }
    }
  }

  .sidebar-toggle {
    @media (min-width: 800px) {
      display: none;
    }
  }

  .tabs {
    display: flex;
    height: 100%;
    align-items: center;
    gap: var(--j-space-600);

    .tab-divider {
      width: 1px;
      height: 100%;
      background: var(--j-color-ui-200);
      margin: 0 var(--j-space-300);
    }
  }

  .perspective-view {
    position: relative;
    height: calc(100% - var(--app-header-height));
    overflow-y: auto;
    display: block;
  }
}

.tab {
  height: 100%;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  color: var(--j-color-ui-500);
  font-size: var(--j-font-size-500);
  cursor: pointer;
  position: relative;
  padding: var(--j-space-200) 0;
  border-bottom: 1px solid transparent;

  &:hover {
    color: var(--j-color-black);
  }

  &.checked {
    position: relative;
    border-bottom: 1px solid var(--j-color-primary-500);
    color: var(--j-color-black);
  }

  input {
    position: absolute;
    clip: rect(1px 1px 1px 1px);
    clip: rect(1px, 1px, 1px, 1px);
    vertical-align: middle;
  }
}

.tab-modal {
  height: 100%;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  color: var(--j-color-ui-500);
  font-size: var(--j-font-size-500);
  cursor: pointer;
  position: relative;
  padding: var(--j-space-300);
  border-radius: 6px;

  &:hover {
    color: var(--j-color-black);
  }

  &.checked {
    position: relative;
    background: var(--j-color-primary-100);
    color: var(--j-color-black);
  }

  input {
    position: absolute;
    clip: rect(1px 1px 1px 1px);
    clip: rect(1px, 1px, 1px, 1px);
    vertical-align: middle;
  }
}

.split {
  width: 50%;
}

.right {
  position: absolute;
  top: var(--app-header-height);
  right: 0;
  padding: var(--j-space-600);
  width: 50%;
}
</style>
