<template>
  <div>
    <j-box v-if="loading" pt="1000">
      <j-flex direction="column" a="center" j="center" gap="500">
        <j-spinner />
        <span>Loading plugin...</span>
      </j-flex>
    </j-box>

    <component
      v-if="wcName"
      :is="wcName"
      class="perspective-view"
      :class="{ split: webrtcModalOpen, right: webrtcModalOpen && wcName === '@coasys/flux-webrtc-view' }"
      :source="channelId"
      :agent="app.ad4mClient.agent"
      :perspective="perspective"
      :getProfile="getCachedAgentProfile"
      :appStore="app"
      :currentView="route.params.viewId"
      :setModalOpen="() => null"
      @click="onViewClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    />
  </div>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { useAppStore } from "@/store";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Channel, generateWCName, joinCommunity } from "@coasys/flux-api";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "ViewView" });
const { communityId, channelId, viewId } = defineProps({
  communityId: { type: String },
  channelId: { type: String },
  viewId: { type: String },
  defaultViewId: { type: String },
});

const router = useRouter();
const route = useRoute();
const app = useAppStore();
const { perspective } = useCommunityService();

const loading = ref(true);
const wcName = ref<string>("");
const webrtcModalOpen = ref(false);
const activeProfile = ref<string>("");
const showProfile = ref(false);
const isJoiningCommunity = ref(false);

// Todo: look into this
async function onViewClick(e: any) {
  const parentLink = e.target.closest("a");
  if (parentLink) {
    const url = parentLink.href;
    if (!url.startsWith("http")) e.preventDefault();
    if (url.startsWith("neighbourhood://")) onNeighbourhoodClick(url);
    if (url.startsWith("did:")) onAgentClick(url);
    if (url.startsWith("literal://")) {
      const isChannel = await perspective.isSubjectInstance(url, Channel);
      if (isChannel) router.push({ name: "channel", params: { communityId, channelId: url } });
    }
  }
}

function onAgentClick(did: string) {
  toggleProfile(true, did);
}

async function onNeighbourhoodClick(url: any) {
  const allMyPerspectives = await app.ad4mClient.perspective.all();
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
  // const { channelId } = route.params;

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

onMounted(async () => {
  console.log("*** view mounted", viewId);

  const generatedName = await generateWCName(viewId as string);

  if (!customElements.get(generatedName)) {
    const module = await fetchFluxApp(viewId as string);
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
