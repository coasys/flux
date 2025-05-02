<template>
  <div class="channel-view" style="height: 100%" :class="{ expanded: isExpanded }">
    <div class="channel-view__header">
      <j-button class="channel-view__sidebar-toggle" variant="ghost" @click="() => toggleSidebar()">
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
          <j-button v-if="sameAgent" @click="() => goToEditChannel(activeChannelId)" size="sm" variant="ghost">
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
              :class="{ 'channel-view-tab': true, checked: app.pkg === currentView }"
              v-for="app in apps"
              @click="() => changeCurrentView(app.pkg)"
            >
              <j-icon :name="app.icon" size="xs" />
              <span>{{ app.name }}</span>
            </label>

            <j-tooltip placement="auto" title="Manage views">
              <j-button v-if="sameAgent" @click="() => goToEditChannel(activeChannelId)" size="sm" variant="ghost">
                <j-icon size="md" name="plus" />
              </j-button>
            </j-tooltip>
          </div>
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

    <template v-for="app in apps">
      <component
        v-if="wcNames[app.pkg]"
        v-show="
          (currentView === app.pkg && wcNames[app.pkg]) || (webrtcModalOpen && app.pkg === `@coasys/flux-webrtc-view`)
        "
        :is="wcNames[app.pkg]"
        class="perspective-view"
        :class="{ split: webrtcModalOpen, right: webrtcModalOpen && app.pkg === '@coasys/flux-webrtc-view' }"
        :source="activeChannelId"
        :agent="ad4mClient.agent"
        :perspective="perspective"
        :appStore="appStore"
        :currentView="currentView"
        :setModalOpen="() => (webrtcModalOpen = false)"
        @click="onViewClick"
        @hide-notification-indicator="onHideNotificationIndicator"
      />
      <j-box pt="1000" v-show="currentView === app.pkg" v-else>
        <j-flex direction="column" a="center" j="center" gap="500">
          <j-spinner />
          <span>Loading plugin...</span>
        </j-flex>
      </j-box>
    </template>

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
        <Hourglass width="30px"></Hourglass>
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
          :class="{ 'channel-view-tab-2': true, checked: app.pkg === currentView }"
          v-for="app in apps"
          @click="() => changeCurrentView(app.pkg)"
        >
          <input
            :name="channel?.baseExpression"
            type="radio"
            :checked.prop="app.pkg === currentView"
            :value.prop="app.pkg"
          />
          <j-icon :name="app.icon" size="xs" />
          <span>{{ app.name }}</span>
        </label>
      </j-box>
    </j-modal>
  </div>
</template>

<script setup lang="ts">
import Hourglass from "@/components/hourglass/Hourglass.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import Profile from "@/containers/Profile.vue";
import { useAppStore } from "@/store/app";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { App, Channel, generateWCName, joinCommunity } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "ChannelView" });

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const { activeCommunityId, activeChannelId } = storeToRefs(appStore);
const { me, ad4mClient, setActiveChannelId, setShowEditChannel, toggleSidebar } = appStore;
const { perspective, channels } = useCommunityService();

const wcNames = ref<Record<string, string>>({});
const currentView = ref("");
const webrtcModalOpen = ref(false);
const allDefined = ref(false);
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

const channel = computed(() => channels.value.find((c) => c.baseExpression === activeChannelId.value));
const sameAgent = computed(() => channel.value?.author === me.did);
const isMobile = computed(() => window.innerWidth <= 768);

const { entries: apps } = useModel({ perspective, model: App, query: { source: activeChannelId.value } });

// Watch for app changes
watch(
  () => apps.value,
  async (newApps, oldApps) => {
    // Skip if no changes
    if (oldApps && newApps.every((app, i) => app.pkg === oldApps[i]?.pkg)) return;

    // Update the current view if changed
    if (!currentView.value) currentView.value = newApps[0]?.pkg;

    // Add new views
    newApps.forEach(async (app: App) => {
      const wcName = await generateWCName(app.pkg);

      if (customElements.get(wcName)) wcNames.value[app.pkg] = wcName;
      else {
        const module = await fetchFluxApp(app.pkg);
        if (module?.default) {
          try {
            await customElements.define(wcName, module.default);
            wcNames.value[app.pkg] = wcName;
          } catch (e) {
            console.error(`Failed to define custom element ${wcName}:`, e);
          }
        }
      }
    });
  }
);

async function onViewClick(e: any) {
  const parentLink = e.target.closest("a");
  if (parentLink) {
    const url = parentLink.href;
    if (!url.startsWith("http")) e.preventDefault();
    if (url.startsWith("neighbourhood://")) onNeighbourhoodClick(url);
    if (url.startsWith("did:")) onAgentClick(url);
    if (url.startsWith("literal://")) {
      const isChannel = await perspective.isSubjectInstance(url, Channel);
      if (isChannel) router.push({ name: "channel", params: { communityId: activeCommunityId.value, channelId: url } });
    }
  }
}

function goToEditChannel(id: string) {
  setActiveChannelId(id);
  setShowEditChannel(true);
}

function changeCurrentView(value: string) {
  // If entering WebRTC or Synergy view, close WebRTC modal
  if (["@coasys/flux-webrtc-view", "@coasys/flux-synergy-demo-view"].includes(value)) webrtcModalOpen.value = false;
  // Else if leaving WebRTC view & not small screen, open WebRTC modal
  else if (currentView.value === "@coasys/flux-webrtc-view" && window.innerWidth > 900) webrtcModalOpen.value = true;

  currentView.value = value;
  isChangeChannel.value = false;
}

function onAgentClick(did: string) {
  toggleProfile(true, did);
}

function onIsChannelChange() {
  isChangeChannel.value = !isChangeChannel.value;
}

async function onNeighbourhoodClick(url: any) {
  const allMyPerspectives = await ad4mClient.perspective.all();
  const neighbourhood = allMyPerspectives.find((p) => p.sharedUrl === url);

  if (!neighbourhood) joinCommunityHandler(url);
  else router.push({ name: "community", params: { communityId: neighbourhood.uuid } });
}

function joinCommunityHandler(url: string) {
  isJoiningCommunity.value = true;
  joinCommunity({ joiningLink: url })
    .then((community) => router.push({ name: "community", params: { communityId: community.uuid } }))
    .finally(() => (isJoiningCommunity.value = false));
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
  if (did === me.did) router.push({ name: "home", params: { did } });
  else router.push({ name: "profile", params: { did, communityId: activeCommunityId.value } });
}
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
