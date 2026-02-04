<template>
  <div class="left-nav__communities-list">
    <j-tooltip v-for="(community, communityUrl) in myCommunities" :key="communityUrl" :title="community.name || 'Unknown Community'">
      <j-popover event="contextmenu">
        <div slot="trigger" :class="getAvatarClasses(communityUrl)">
          <div v-if="isInCall(communityUrl)" class="recording-icon">
            <RecordingIcon :size="30" />
          </div>

          <j-avatar
            class="left-nav__community-item"
            :src="community.image || null"
            :initials="`${community?.name}`.charAt(0).toUpperCase()"
            @click="() => handleCommunityClick(communityUrl as string)"
          />
        </div>

        <j-menu slot="content">
          <j-menu-item @click="() => handleSetShowLeaveCommunity(true)">
            <j-icon slot="start" size="xs" name="box-arrow-left" />
            Leave community
          </j-menu-item>

          <j-menu-item @click="() => muteCommunity(communityUrl as string)">
            <j-icon size="xs" slot="start" name="bell" />
            Mute Community
          </j-menu-item>

          <j-menu-item @click="() => toggleHideMutedChannels(communityUrl as string)">
            <j-icon size="xs" slot="start" name="toggle-on" />
            Hide muted channels
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-tooltip>

    <j-tooltip title="Create or join community">
      <j-button @click="() => (modalStore.showCreateCommunity = true)" square circle variant="subtle">
        <j-icon size="md" name="plus" />
      </j-button>
    </j-tooltip>
  </div>
</template>

<script setup lang="ts">
import RecordingIcon from '@/components/icons/RecordingIcon.vue';
import { useAppStore, useModalStore, useRouteMemoryStore, useUiStore, useWebrtcStore } from '@/stores';
import { stripNeighbourhoodPrefix } from '@/utils/routeUtils';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const appStore = useAppStore();
const modalStore = useModalStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();
const routeMemoryStore = useRouteMemoryStore();

const { myCommunities } = storeToRefs(appStore);
const { inCall, callRoute } = storeToRefs(webrtcStore);

function isInCall(communityUrl: string) {
  return inCall.value && callRoute.value.communityId === communityUrl;
}

function isPresent(communityUrl: string) {
  return route.params.communityId === stripNeighbourhoodPrefix(communityUrl);
}

function getAvatarClasses(communityUrl: string) {
  return { 'avatar-wrapper': true, 'in-call': isInCall(communityUrl), present: isPresent(communityUrl) };
}

// Todo: Implement hidding muted channels
function toggleHideMutedChannels(id: string) {
  // this.dataStore.toggleHideMutedChannels({ communityId: id });
}

// Todo: Implement mute community
function muteCommunity(id: string) {
  // toggleCommunityMute({ communityId: id });
}

function handleSetShowLeaveCommunity(show: boolean) {
  modalStore.showLeaveCommunity = show;
}

function handleCommunityClick(communityUrl: string) {
  if (isPresent(communityUrl)) uiStore.toggleCommunitySidebar();
  else {
    uiStore.setCommunitySidebarOpen(true);
    // Navigate back to the last route if saved
    const communityId = stripNeighbourhoodPrefix(communityUrl);
    const lastRoute = routeMemoryStore.getLastCommunityRoute(communityId);
    router.push(lastRoute ? lastRoute.path : { name: 'community', params: { communityId } });
  }
}
</script>

<style lang="scss" scoped>
.left-nav__communities-list {
  padding-top: 4px;
  width: 100%;
  height: 100%;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
  overflow-y: scroll;
  overflow-x: visible;

  &::-webkit-scrollbar {
    display: none;
  }
}

.left-nav__community-item {
  cursor: pointer;
}

.avatar-wrapper {
  border-radius: 50%;
  width: var(--j-size-md);
  height: var(--j-size-md);

  &.present {
    box-shadow: 0 0 0 2px var(--j-color-primary-500);
  }

  &.in-call {
    box-shadow: 0 0 0 2px var(--j-color-danger-400);

    &.present {
      box-shadow: 0 0 0 3px var(--j-color-danger-400);
    }
  }

  .recording-icon {
    position: absolute;
    z-index: 5;
    bottom: -4.8px;
    right: -4.8px;
    pointer-events: none;
  }
}
</style>
