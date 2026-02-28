<template>
  <div>
    <j-box v-if="loading" pt="1000">
      <j-flex direction="column" a="center" j="center" gap="500">
        <j-spinner />
        <span>Loading plugin...</span>
      </j-flex>
    </j-box>

    <Conversation v-if="viewId === 'conversation'" />

    <Conversations v-if="viewId === 'conversations'" :parentChannel="channel" />

    <!-- <SubChannels v-if="viewId === 'sub-channels'" :parentChannel="channel" /> -->

    <component
      v-else-if="wcName"
      :is="wcName"
      style="height: 100%"
      :class="{ split: webrtcModalOpen, right: webrtcModalOpen && wcName === '@coasys/flux-webrtc-view' }"
      :source="restoreChannelPrefix(channelId)"
      :agent="appStore.ad4mClient.agent"
      :client="appStore.ad4mClient"
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

<script lang="ts">
// Module-level map — prevents concurrent customElements.define() calls for the
// same generated tag name when multiple ViewView instances mount simultaneously.
const _wcDefineInProgress = new Map<string, Promise<void>>();
</script>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import Conversation from '@/containers/Conversation.vue';
import Conversations from '@/containers/Conversations.vue';
import { useAiStore, useAppStore, useUiStore, useWebrtcStore } from '@/stores';
import fetchFluxApp from '@/utils/fetchFluxApp';
import { stripNeighbourhoodPrefix, stripChannelPrefix, restoreChannelPrefix } from '@/utils/routeUtils';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { Channel, generateWCName, joinCommunity } from '@coasys/flux-api';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'ViewView' });
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
const wcName = ref<string>('');
const webrtcModalOpen = ref(false);
const activeProfile = ref<string>('');
const showProfile = ref(false);
const isJoiningCommunity = ref(false);

// Todo: look into this
async function onViewClick(e: any) {
  const parentLink = e.target.closest('a');
  if (parentLink) {
    const url = parentLink.href;
    if (!url.startsWith('http')) e.preventDefault();
    if (url.startsWith('neighbourhood://')) onNeighbourhoodClick(url);
    if (url.startsWith('did:')) onAgentClick(url);
    if (url.startsWith('literal://')) {
      const isChannel = await perspective.isSubjectInstance(url, Channel);
      if (isChannel) {
        router.push({ name: 'channel', params: { communityId, channelId: stripChannelPrefix(url) } });
      }
    }
  }
}

function onAgentClick(did: string) {
  toggleProfile(true, did);
}

async function onNeighbourhoodClick(url: any) {
  const neighbourhood = appStore.myPerspectives.find((p) => p.sharedUrl === url);

  if (!neighbourhood) joinCommunityHandler(url);
  else if (neighbourhood.sharedUrl)
    router.push({ name: 'community', params: { communityId: stripNeighbourhoodPrefix(neighbourhood.sharedUrl) } });
}

function joinCommunityHandler(url: string) {
  isJoiningCommunity.value = true;
  joinCommunity({ joiningLink: url, client: appStore.ad4mClient })
    .then((community) =>
      router.push({ name: 'community', params: { communityId: stripNeighbourhoodPrefix(community.neighbourhoodUrl) } }),
    )
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
  if (!open) activeProfile.value = '';
  else activeProfile.value = did;
  showProfile.value = open;
}

onMounted(async () => {
  // Skip web component generation if mounting the conversation view
  if (!['conversation', 'sub-channels', 'conversations'].includes(viewId as string)) {
    const generatedName = await generateWCName(viewId as string);

    if (!customElements.get(generatedName)) {
      // Deduplicate concurrent define() attempts for the same element name.
      // Without this, two ViewView instances mounting at the same time both pass
      // the customElements.get() check and the second define() call throws.
      if (!_wcDefineInProgress.has(generatedName)) {
        const definePromise = (async () => {
          const module = await fetchFluxApp(viewId as string);
          if (module?.default) {
            try {
              customElements.define(generatedName, module.default);
            } catch (e) {
              console.error(`Failed to define custom element ${generatedName}:`, e);
            }
          }
        })();
        _wcDefineInProgress.set(generatedName, definePromise);
        definePromise.finally(() => _wcDefineInProgress.delete(generatedName));
      }
      await _wcDefineInProgress.get(generatedName);
    }

    wcName.value = generatedName;
  }
  loading.value = false;
});
</script>
