<template>
  <div class="sidebar-header">
    <div class="sidebar-header__top">
      <j-button
        variant="ghost"
        size="sm"
        @click="() => appStore.toggleMainSidebar()"
      >
        <j-icon
          size="sm"
          :name="appStore.showMainSidebar ? 'layout-sidebar' : 'layout-sidebar'"
        ></j-icon>
      </j-button>
      <j-popover
        :open="showCommunityMenu"
        @toggle="(e: any) => (showCommunityMenu = e.target.open)"
        :class="{ 'is-creator': isCreator }"
        event="click"
        placement="bottom-end"
      >
        <j-button square slot="trigger" variant="ghost">
          <j-icon size="sm" name="sliders2"></j-icon>
        </j-button>
        <j-menu slot="content">
          <j-menu-item
            v-if="isCreator"
            @click="() => setShowEditCommunity(true)"
          >
            <j-icon size="xs" slot="start" name="pencil" />
            Edit community
          </j-menu-item>
          <j-menu-item @click="() => setShowInviteCode(true)">
            <j-icon size="xs" slot="start" name="person-plus" />
            Invite people
          </j-menu-item>
          <j-divider />
          <j-menu-item @click="() => setShowCreateChannel(true)">
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
      <Avatar
        size="xl"
        :initials="community.name?.charAt(0).toUpperCase()"
        :src="community.image || null"
      ></Avatar>
      <div class="community-info-content">
        <j-text size="500" nomargin color="black">
          {{ community.name || "No name" }}
        </j-text>
        <j-text nomargin size="400" color="ui-500">
          {{
            isSynced
              ? community.description || "No description"
              : "syncing community..."
          }}
        </j-text>
        <j-box pt="400" v-if="!isSynced">
          <LoadingBar></LoadingBar>
        </j-box>
      </div>
    </div>
    <div class="warning-box">
      <j-flex a="center" gap="300">
        <j-icon
          name="exclamation-circle"
          size="xs"
          color="warning-500"
        ></j-icon>
        <j-text nomargin weight="700" size="400" color="warning-500"
          >Warning</j-text
        >
      </j-flex>
      <j-text nomargin size="300" color="warning-500">
        Flux is still in the alpha phase, things may break.
        <a href="https://discord.gg/pWCA3wQrtE" target="_blank">
          Join our Discord and report bugs here.
        </a>
      </j-text>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRoute } from "vue-router";
import { Profile } from "@coasys/flux-types";
import { mapActions } from "pinia";
import { useAppStore } from "@/store/app";
import Avatar from "@/components/avatar/Avatar.vue";
import LoadingBar from "@/components/loading-bar/LoadingBar.vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { useMe } from "@coasys/flux-vue";
import { Ad4mClient } from "@perspect3vism/ad4m";

export default defineComponent({
  components: { Avatar, LoadingBar },
  props: {
    isSynced: Boolean,
    community: {
      type: Object,
      required: true,
    },
  },
  async setup(props) {
    const client: Ad4mClient = await getAd4mClient();

    const { status, me, profile } = useMe(client.agent);

    return {
      profile,
      status,
      me,
      showCommunityMenu: ref(false),
      appStore: useAppStore(),
    };
  },
  computed: {
    isCreator(): boolean {
      return this.community.author === this.me?.did;
    },
    userProfile(): Profile | null {
      return this.profile;
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setSidebar",
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    goToLeaveCommunity() {
      this.appStore.setActiveCommunity(
        this.$route.params.communityId as string
      );
      this.appStore.setShowLeaveCommunity(true);
    },
    goToSettings() {
      this.setShowCommunitySettings(true);
      this.showCommunityMenu = false;
    },
  },
});
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
