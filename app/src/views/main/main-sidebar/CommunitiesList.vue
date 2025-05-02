<template>
  <div class="left-nav__communities-list">
    <j-tooltip v-for="(community, uuid) in myCommunities" :key="uuid" :title="community.name || 'Unknown Community'">
      <j-popover event="contextmenu">
        <j-avatar
          slot="trigger"
          class="left-nav__community-item"
          :selected="communityIsActive(uuid as string)"
          :online="false"
          :src="community.image || undefined"
          :initials="`${community?.name}`.charAt(0).toUpperCase()"
          @click="() => handleCommunityClick(uuid as string)"
        />
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
import { useAppStore, useModalStore, useUIStore } from "@/store";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const app = useAppStore();
const modals = useModalStore();
const ui = useUIStore();

const { myCommunities } = storeToRefs(app);

function communityIsActive(communityId: string) {
  return route.params.communityId === communityId;
}

function toggleHideMutedChannels(id: string) {
  // this.dataStore.toggleHideMutedChannels({ communityId: id });
}

function muteCommunity(id: string) {
  // Todo: Implement mute community functionality
  // toggleCommunityMute({ communityId: id });
}

function handleSetShowLeaveCommunity(show: boolean, uuid: string) {
  app.setActiveCommunityId(uuid);
  modals.setShowLeaveCommunity(show);
}

function handleCommunityClick(communityId: string) {
  console.log("community clicked", communityId);
  if (communityIsActive(communityId)) ui.toggleSidebar();
  else {
    ui.setSidebar(true);
    router.push({ name: "community", params: { communityId } });
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
</style>
