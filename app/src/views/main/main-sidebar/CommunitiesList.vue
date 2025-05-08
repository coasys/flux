<template>
  <div class="left-nav__communities-list">
    <j-tooltip v-for="(community, uuid) in myCommunities" :key="uuid" :title="community.name || 'Unknown Community'">
      <j-popover event="contextmenu">
        <div slot="trigger" :class="getAvatarClasses(uuid)">
          <div v-if="isInCall(uuid)" class="recording-icon">
            <RecordingIcon :size="30" />
          </div>

          <j-avatar
            class="left-nav__community-item"
            :src="community.image || null"
            :initials="`${community?.name}`.charAt(0).toUpperCase()"
            @click="() => handleCommunityClick(uuid as string)"
          />
        </div>

        <j-menu slot="content">
          <j-menu-item @click="() => handleSetShowLeaveCommunity(true, uuid as string)">
            <j-icon slot="start" size="xs" name="box-arrow-left"></j-icon>
            Leave community
          </j-menu-item>

          <j-menu-item @click="() => muteCommunity(uuid as string)"
            ><j-icon size="xs" slot="start" name="bell" />
            Mute Community
          </j-menu-item>

          <j-menu-item @click="() => toggleHideMutedChannels(uuid as string)">
            <j-icon size="xs" slot="start" name="toggle-on" />
            Hide muted channels
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-tooltip>

    <j-tooltip title="Create or join community">
      <j-button @click="() => modals.setShowCreateCommunity(true)" square circle variant="subtle">
        <j-icon size="md" name="plus"></j-icon>
      </j-button>
    </j-tooltip>
  </div>
</template>

<script setup lang="ts">
import RecordingIcon from "@/components/recording-icon/RecordingIcon.vue";
import { useAppStore, useModalStore, useRouteMemoryStore, useUIStore } from "@/store";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const app = useAppStore();
const modals = useModalStore();
const ui = useUIStore();

const { myCommunities, callRoute } = storeToRefs(app);

function isInCall(uuid: string) {
  return callRoute.value?.communityId === uuid;
}

function isPresent(uuid: string) {
  return route.params.communityId === uuid;
}

function getAvatarClasses(uuid: string) {
  return { "avatar-wrapper": true, "in-call": isInCall(uuid), present: isPresent(uuid) };
}

function communityIsActive(communityId: string) {
  return route.params.communityId === communityId;
}

// Todo: Implement hidding muted channels
function toggleHideMutedChannels(id: string) {
  // this.dataStore.toggleHideMutedChannels({ communityId: id });
}

// Todo: Implement mute community
function muteCommunity(id: string) {
  // toggleCommunityMute({ communityId: id });
}

function handleSetShowLeaveCommunity(show: boolean, uuid: string) {
  modals.setShowLeaveCommunity(show);
}

// Todo: investigate why toggleSidebar class applied in CommunityLayout doesn't change the UI
function handleCommunityClick(communityId: string) {
  if (communityIsActive(communityId)) ui.toggleSidebar();
  else {
    ui.setSidebar(true);
    // Navigate back to the last route if saved
    const routeMemory = useRouteMemoryStore();
    const lastRoute = routeMemory.getLastRoute(communityId);
    router.push(lastRoute ? lastRoute.path : { name: "community", params: { communityId } });
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
