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
          <j-icon size="xs" name="gear"></j-icon>
        </j-button>
        <j-menu slot="content">
          <j-menu-item
            v-if="isCreator"
            @click="() => setShowEditCommunity(true)"
          >
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
    <div class="community-info">
      <Avatar
        class="masked"
        size="xl"
        :url="community.neighbourhood.image"
      ></Avatar>
      <div>
        <j-text size="500" nomargin color="black">
          {{ community.neighbourhood.name }}
        </j-text>
        <j-text nomargin size="400" color="ui-500">
          {{ community.neighbourhood.description || "No description" }}
        </j-text>
      </div>
    </div>
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
import Avatar from "@/components/avatar/Avatar.vue";

export default defineComponent({
  components: { Avatar },
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
.sidebar-header {
  background: var(--app-drawer-bg-color);
  z-index: 1;
  display: block;
  padding-left: var(--j-space-400);
  gap: var(--j-space-300);
}

.sidebar-header__top {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.masked {
  display: block;
  -webkit-clip-path: url("#svgClip");
  clip-path: url("#svgClip");
}

.community-info {
  margin-top: var(--j-space-400);
  display: flex;
  align-items: center;
  gap: var(--j-space-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 500;
  color: var(--j-color-ui-800);
  font-size: var(--j-font-size-500);
  text-overflow: ellipsis;
  min-height: 68px;
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}
</style>
