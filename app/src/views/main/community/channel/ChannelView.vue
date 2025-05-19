<template>
  <div class="channel-view" style="height: 100%" :class="{ expanded: isExpanded }">
    <div class="channel-view__header">
      <j-button class="channel-view__sidebar-toggle" variant="ghost" @click="() => ui.toggleCommunitySidebar()">
        <j-icon color="ui-800" size="md" name="arrow-left-short" />
      </j-button>

      <div v-if="isMobile" class="channel-view__header-actions">
        <j-box pr="500" @click="onIsChannelChange">
          <j-flex a="center" gap="200">
            <j-icon name="hash" size="md" color="ui-300" />

            <j-text color="black" weight="700" size="500" nomargin>
              {{ channel?.name }}
            </j-text>
          </j-flex>

          <j-box pl="600">
            <j-text variant="label" size="200">Change View</j-text>
          </j-box>
        </j-box>

        <j-tooltip placement="auto" title="Manage views">
          <j-button v-if="sameAgent" @click="goToEditChannel" size="sm" variant="ghost">
            <j-icon size="md" name="plus" />
          </j-button>
        </j-tooltip>
      </div>

      <div class="channel-view__header-actions" v-if="!isMobile">
        <div class="channel-view__header-left">
          <j-box pr="500">
            <j-flex a="center" gap="200">
              <j-icon name="hash" size="md" color="ui-300" />
              <j-text color="black" weight="700" size="500" nomargin>
                {{ channel?.name }}
              </j-text>
            </j-flex>
          </j-box>

          <div class="channel-view__tabs">
            <label
              v-for="view in views"
              :class="{ 'channel-view-tab': true, checked: view.pkg === viewId }"
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

          <j-button size="sm" variant="primary" style="margin-left: 25px" :onClick="() => ui.setCallWindowOpen(true)">
            <j-icon size="sm" name="telephone" style="margin-right: -5px" />
            Start call
          </j-button>
        </div>
      </div>

      <div v-if="!isMobile" class="channel-view__header-right">
        <j-tooltip placement="auto" :title="isExpanded ? 'Minimize' : 'Fullsize'">
          <j-button size="sm" variant="ghost">
            <j-icon
              size="sm"
              :name="isExpanded ? 'arrows-angle-contract' : 'arrows-angle-expand'"
              @click="isExpanded = !isExpanded"
            />
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
      <Profile :did="activeProfile" @openCompleteProfile="() => handleProfileClick(activeProfile)" />
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
          :class="{ 'channel-view-tab-2': true, checked: view.pkg === currentView }"
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
import Hourglass from "@/components/hourglass/Hourglass.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import Profile from "@/containers/Profile.vue";
import { useAppStore, useModalStore, useUIStore } from "@/store";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { App } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "ChannelView" });
const { communityId, channelId, viewId } = defineProps({
  communityId: { type: String },
  channelId: { type: String },
  viewId: { type: String },
});

const router = useRouter();
const route = useRoute();
const app = useAppStore();
const modals = useModalStore();
const ui = useUIStore();
const { me } = storeToRefs(app);
const { perspective, channels } = useCommunityService();

const currentView = ref("");
const webrtcModalOpen = ref(false);
const showEditChannel = ref(false);
const script = ref<HTMLElement | null>(null);
const memberMentions = ref<MentionTrigger[]>([]);
const activeProfile = ref<string>("");
const showProfile = ref(false);
const isJoiningCommunity = ref(false);
const isExpanded = ref(false);
const isChangeChannel = ref(false);

interface MentionTrigger {
  label: string;
  id: string;
  trigger: string;
}

const channel = computed(() => channels.value.find((c) => c.baseExpression === channelId));
const sameAgent = computed(() => channel.value?.author === me.value.did);
const isMobile = computed(() => window.innerWidth <= 768);

const { entries: views } = useModel({
  perspective,
  model: App,
  query: { source: channelId },
});

function goToEditChannel() {
  modals.setShowEditChannel(true);
}

function changeCurrentView(value: string) {
  // If entering WebRTC or Synergy view, close WebRTC modal
  if (["@coasys/flux-webrtc-view", "@coasys/flux-synergy-demo-view"].includes(value)) webrtcModalOpen.value = false;
  // Else if leaving WebRTC view & not small screen, open WebRTC modal
  else if (currentView.value === "@coasys/flux-webrtc-view" && window.innerWidth > 900) webrtcModalOpen.value = true;

  router.push({ name: "view", params: { communityId, channelId, viewId: value } });
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

onMounted(() => {
  console.log("*** channel mounted", channelId);
});

// Navigate to the first loaded view if no viewId set in the URL params
watch(views, (newVal, oldVal) => {
  const firstResults = (!oldVal || oldVal.length === 0) && newVal.length > 0;
  if (firstResults && !viewId) router.push({ name: "view", params: { viewId: newVal[0].pkg } });
});
</script>

<style>
.expanded {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 999999;
}

.channel-view {
  position: relative;
  background: var(--app-channel-bg-color, transparent);
}

.channel-view__header {
  display: flex;
  align-items: center;
  gap: var(--j-space-400);
  padding: 0 var(--j-space-200);
  position: sticky;
  background: var(--app-channel-header-bg-color, transparent);
  border-bottom: 1px solid var(--app-channel-header-border-color, var(--j-border-color));
  height: var(--app-header-height);
}

.channel-view__header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  height: 100%;
}

.channel-view__header-left {
  display: flex;
  align-items: center;
  height: 100%;
  gap: var(--j-space-300);
}

.channel-view__header-right {
  align-self: center;
}

.perspective-view {
  position: relative;
  height: calc(100% - var(--app-header-height));
  overflow-y: auto;
  display: block;
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

.channel-view__tabs {
  display: flex;
  height: 100%;
  align-items: center;
  gap: var(--j-space-500);
}

.channel-view-tab {
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
}

.channel-view-tab-2 {
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
}

.channel-view-tab:hover {
  color: var(--j-color-black);
}

.channel-view-tab-2:hover {
  color: var(--j-color-black);
}

.channel-view-tab.checked {
  position: relative;
  border-bottom: 1px solid var(--j-color-primary-500);
  color: var(--j-color-black);
}

.channel-view-tab-2.checked {
  position: relative;
  background: var(--j-color-primary-100);
  color: var(--j-color-black);
}

.channel-view-tab input {
  position: absolute;
  clip: rect(1px 1px 1px 1px);
  clip: rect(1px, 1px, 1px, 1px);
  vertical-align: middle;
}

.channel-view-tab-2 input {
  position: absolute;
  clip: rect(1px 1px 1px 1px);
  clip: rect(1px, 1px, 1px, 1px);
  vertical-align: middle;
}

@media (min-width: 800px) {
  .channel-view__sidebar-toggle {
    display: none;
  }
  .channel-view__header {
    padding: 0 var(--j-space-500);
    justify-content: space-between;
    gap: 0;
  }
}

.perspective-view {
  display: block;
  height: calc(100% - var(--app-header-height));
}
</style>
