<template>
  <div>
    <j-box v-if="loading" pt="1000">
      <j-flex direction="column" a="center" j="center" gap="500">
        <j-spinner />
        <span>Loading plugin...</span>
      </j-flex>
    </j-box>

    <SynergyView v-if="viewId === 'conversation'" />

    <!-- <SubChannels v-if="viewId === 'sub-channels'" :parentChannel="channel" /> -->

    <Conversations v-if="viewId === 'conversations'" :parentChannel="channel" />

    <component
      v-else-if="wcName"
      :is="wcName"
      style="height: 100%"
      :class="{ split: webrtcModalOpen, right: webrtcModalOpen && wcName === '@coasys/flux-webrtc-view' }"
      :source="channelId"
      :agent="appStore.ad4mClient.agent"
      :perspective="perspective"
      :getProfile="getCachedAgentProfile"
      :appStore="appStore"
      :webrtcStore="webrtcStore"
      :uiStore="uiStore"
      :aiStore="aiStore"
      :signallingService="signallingService"
      :router="router"
      :currentView="route.params.viewId"
      :setModalOpen="() => null"
      @click="onViewClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    />
  </div>
</template>

<script setup lang="ts">
import Conversations from "@/components/conversations/Conversations.vue";
import SynergyView from "@/components/synergy/SynergyView.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { useAiStore, useAppStore, useUiStore, useWebrtcStore } from "@/stores";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Channel, generateWCName, joinCommunity } from "@coasys/flux-api";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "ViewView" });
interface Props {
  communityId: string;
  channelId: string;
  viewId: string;
  defaultViewId?: string;
  channel: Channel;
}

const props = defineProps<Props>();
const { communityId, channelId, viewId, channel } = props;

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();
const aiStore = useAiStore();
const { perspective, signallingService } = useCommunityService();

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
  const allMyPerspectives = await appStore.ad4mClient.perspective.all();
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
  // Skip web component generation if mounting the conversation view
  if (!["conversation", "sub-channels", "conversations"].includes(viewId as string)) {
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
  }
  loading.value = false;
});
</script>
