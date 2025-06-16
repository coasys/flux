<template>
  <div class="sidebar-header">
    <div class="sidebar-header__top">
      <j-button variant="ghost" size="sm" @click="uiStore.toggleAppSidebar">
        <j-icon size="sm" :name="showAppSidebar ? 'layout-sidebar' : 'layout-sidebar'" />
      </j-button>

      <j-popover
        :open="showCommunityMenu"
        @toggle="(e: any) => (showCommunityMenu = e.target.open)"
        :class="{ 'is-author': isAuthor }"
        event="click"
        placement="bottom-end"
      >
        <j-button square slot="trigger" variant="ghost">
          <j-icon size="sm" name="sliders2"></j-icon>
        </j-button>
        <j-menu slot="content">
          <j-menu-item v-if="isAuthor" @click="() => (modalsStore.showEditCommunity = true)">
            <j-icon size="xs" slot="start" name="pencil" />
            Edit community
          </j-menu-item>
          <j-menu-item @click="() => (modalsStore.showInviteCode = true)">
            <j-icon size="xs" slot="start" name="person-plus" />
            Invite people
          </j-menu-item>
          <j-divider />
          <j-menu-item @click="() => (modalsStore.showCreateChannel = true)">
            <j-icon size="xs" slot="start" name="plus" />
            Create channel
          </j-menu-item>
          <j-menu-item>
            <j-icon size="xs" slot="start" name="toggle-on" />
            Hide muted channels
          </j-menu-item>
          <j-menu-item @click="() => goToLeaveCommunity()">
            <j-icon size="xs" slot="start" name="box-arrow-left" />
            Leave community
          </j-menu-item>
        </j-menu>
      </j-popover>
    </div>
    <div class="community-info">
      <j-avatar size="xl" :initials="`${community?.name}`.charAt(0).toUpperCase()" :src="community?.image || null" />
      <div class="community-info-content">
        <j-text size="500" nomargin color="black">
          {{ community?.name || "No name" }}
        </j-text>
        <j-text nomargin size="400" color="ui-500">
          {{ communityDescription() }}
        </j-text>
        <j-box pt="400" v-if="!isSynced">
          <LoadingBar></LoadingBar>
        </j-box>
      </div>
    </div>
    <div class="warning-box">
      <j-flex a="center" gap="300">
        <j-icon name="exclamation-circle" size="xs" color="warning-500"></j-icon>
        <j-text nomargin weight="700" size="400" color="warning-500">Warning</j-text>
      </j-flex>
      <j-text nomargin size="300" color="warning-500">
        Flux is still in the alpha phase, things may break.
        <a href="https://discord.gg/pWCA3wQrtE" target="_blank"> Join our Discord and report bugs here. </a>
      </j-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingBar from "@/components/loading-bar/LoadingBar.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { useModalStore, useUiStore } from "@/stores";
import { storeToRefs } from "pinia";
import { ref } from "vue";

defineOptions({ name: "Header" });

const uiStore = useUiStore();
const modalsStore = useModalStore();
const { showAppSidebar } = storeToRefs(uiStore);

const { isSynced, isAuthor, community } = useCommunityService();

const showCommunityMenu = ref(false);

function communityDescription() {
  if (!community.value) return "";
  if (!isSynced.value) return "Syncing community...";
  const { description } = community.value;
  // Temp bug fix for undefined model properties being an empty array
  if (Array.isArray(description) || !description) return "No description";
  return description;
}

function goToLeaveCommunity() {
  modalsStore.showLeaveCommunity = true;
}

function goToSettings() {
  modalsStore.showCommunitySettings = true;
  showCommunityMenu.value = false;
}
</script>

<style lang="scss" scoped>
.sidebar-header {
  z-index: 1;
  display: block;
  padding-left: var(--j-space-400);
  padding-right: var(--j-space-400);
  gap: var(--j-space-300);
}

.sidebar-header__top {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.community-info {
  width: 100%;
  margin-top: var(--j-space-400);
  display: flex;
  align-items: center;
  gap: var(--j-space-500);
  padding-right: var(--j-space-200);
  flex: 1;
  font-weight: 500;
  color: var(--j-color-ui-800);
  font-size: var(--j-font-size-500);
  min-height: 68px;

  > j-avatar::part(base) {
    flex-shrink: 0;
  }
}

.community-info-content {
  width: 100%;
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}

.warning-box {
  margin-top: var(--j-space-500);
  background-color: var(--j-color-warning-50);
  border: 1px solid var(--j-color-warning-500);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-300);
}

.warning-box a {
  color: inherit;
}
</style>
