<template>
  <div class="community-sidebar__header">
    <j-button
      variant="ghost"
      size="sm"
      @click="() => appStore.toggleMainSidebar()"
    >
      <j-icon
        size="sm"
        :name="appStore.showMainSidebar ? 'arrow-bar-left' : 'arrow-bar-right'"
      ></j-icon>
    </j-button>
    <div class="community-info">
      {{ community.neighbourhood.name }}
    </div>
    <j-popover
      :open="showCommunityMenu"
      @toggle="(e: any) => (showCommunityMenu = e.target.open)"
      :class="{ 'is-creator': isCreator }"
      event="click"
      placement="bottom-end"
    >
      <button slot="trigger" class="community-sidebar__header-button">
        <j-icon size="xs" name="three-dots"></j-icon>
      </button>
      <j-menu slot="content">
        <j-menu-item v-if="isCreator" @click="() => setShowEditCommunity(true)">
          <j-icon size="xs" slot="start" name="pencil" />
          Edit community
        </j-menu-item>
        <j-menu-item @click="goToSettings">
          <j-icon size="xs" slot="start" name="gear" />
          Settings
        </j-menu-item>
        <j-menu-item @click="goToTweaks">
          <j-icon size="xs" slot="start" name="wrench" />
          Community Tweaks
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
        <j-menu-item
          @click="
            () =>
              toggleHideMutedChannels({
                communityId: community.neighbourhood.uuid,
              })
          "
        >
          <j-icon
            size="xs"
            slot="start"
            :name="
              community.state.hideMutedChannels ? 'toggle-on' : 'toggle-off'
            "
          />
          Hide muted channels
        </j-menu-item>
      </j-menu>
    </j-popover>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { Profile } from "utils/types";
import { ChannelState } from "@/store/types";
import { mapActions, mapState } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { DexieIPFS } from "utils/helpers/storageHelpers";
import { getImage } from "utils/helpers/getImage";

export default defineComponent({
  setup() {
    return {
      userProfileImage: ref<null | string>(null),
      appStore: useAppStore(),
      userStore: useUserStore(),
      dataStore: useDataStore(),
    };
  },
  data: function () {
    return {
      showCommunityMenu: false,
      communityImage: null,
    };
  },
  computed: {
    community() {
      const communityId = this.$route.params.communityId as string;
      return this.dataStore.getCommunityState(communityId);
    },
    channels(): ChannelState[] {
      const communityId = this.$route.params.communityId as string;

      const channels = this.getChannelStates()(communityId);

      if (this.community.state.hideMutedChannels) {
        return channels.filter((e) => !e.notifications.mute);
      }

      return channels;
    },
    isCreator(): boolean {
      return (
        this.community.neighbourhood.author ===
        this.userStore.getUser?.agent.did
      );
    },
    userProfile(): Profile | null {
      return this.userStore.profile;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
  },
  async mounted() {
    watch(this.dataStore.neighbourhoods, async () => {
      setTimeout(async () => {
        const communityId = this.$route.params.communityId as string;
        const community = this.dataStore.getCommunity(communityId);
        const dexie = new DexieIPFS(communityId);

        const image = await dexie.get(community.image!);
        // @ts-ignore
        this.communityImage = image;
      }, 500);
    });
  },
  watch: {
    userProfile: {
      async handler() {
        if (this.userStore.profile?.profilePicture) {
          this.userProfileImage = await getImage(
            this.userStore.profile?.profilePicture
          );
        } else {
          this.userProfileImage = null;
        }
      },
      immediate: true,
    },
    "$route.params.communityId": {
      handler: async function (id: string) {
        if (id) {
          this.communityImage = null;
          setTimeout(async () => {
            const community = this.dataStore.getCommunity(id);
            const dexie = new DexieIPFS(id);

            const image = await dexie.get(community.image!);
            // @ts-ignore
            this.communityImage = image;
          }, 500);
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(useDataStore, ["toggleHideMutedChannels"]),
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, [
      "setSidebar",
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
      "setShowCommunityTweaks",
    ]),
    goToSettings() {
      this.setShowCommunitySettings(true);
      this.showCommunityMenu = false;
    },
    goToTweaks() {
      this.setShowCommunityTweaks(true);
      this.showCommunityMenu = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.community-sidebar__header {
  background: var(--app-drawer-bg-color);
  border-bottom: 1px solid var(--j-color-white);
  z-index: 1;
  display: flex;
  height: var(--app-header-height);
  align-items: center;
  padding-left: var(--j-space-400);
  position: sticky;
  gap: var(--j-space-300);
  top: 0;
  left: 0;
}

.community-sidebar__header-button {
  color: inherit;
  width: 100%;
  height: 74px;
  display: flex;
  align-items: center;
  gap: var(--j-space-400);
  border: 0;
  outline: 0;
  font-family: inherit;
  text-align: left;
  background: none;
  cursor: pointer;
  padding: 0 var(--j-space-500);
  border-bottom: 1px solid var(--app-drawer-border-color);
}

.community-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 500;
  color: var(--j-color-ui-800);
  font-size: var(--j-font-size-500);
  text-overflow: ellipsis;
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}
</style>
