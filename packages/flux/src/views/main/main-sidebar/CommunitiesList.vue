<template>
  <div class="left-nav__communities-list">
    <j-tooltip
      v-for="community in communities"
      :key="community.state.perspectiveUuid"
      :title="community.neighbourhood.name || 'Uknown Communit'"
    >
      <j-popover event="contextmenu">
        <Avatar
          slot="trigger"
          class="left-nav__community-item"
          :selected="communityIsActive(community.state.perspectiveUuid)"
          :online="hasNotification(community.state.perspectiveUuid)"
          :url="community.neighbourhood.image"
          :initials="community.neighbourhood.name.charAt(0).toUpperCase()"
          @click="() => handleCommunityClick(community.state.perspectiveUuid)"
        ></Avatar>
        <j-menu slot="content">
          <j-menu-item
            @click="() => removeCommunity(community.state.perspectiveUuid)"
          >
            Remove community
          </j-menu-item>

          <j-menu-item
            @click="() => muteCommunity(community.state.perspectiveUuid)"
            ><j-icon
              size="xs"
              slot="start"
              :name="
                getCommunityState(community.state.perspectiveUuid).notifications
                  ?.mute
                  ? 'bell-slash'
                  : 'bell'
              "
            />
            {{
              `${
                getCommunityState(community.state.perspectiveUuid).notifications
                  ?.mute
                  ? "Unmute"
                  : "Mute"
              } Community`
            }}
          </j-menu-item>
          <j-menu-item
            @click="
              () => toggleHideMutedChannels(community.state.perspectiveUuid)
            "
          >
            <j-icon
              size="xs"
              slot="start"
              :name="
                getCommunityState(community.state.perspectiveUuid)
                  .hideMutedChannels
                  ? 'toggle-on'
                  : 'toggle-off'
              "
            />
            Hide muted channels
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-tooltip>
    <j-tooltip title="Create or join community">
      <j-button
        @click="() => appStore.setShowCreateCommunity(true)"
        square
        circle
        variant="subtle"
      >
        <j-icon size="md" name="plus"></j-icon>
      </j-button>
    </j-tooltip>
  </div>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { defineComponent } from "vue";
import Avatar from "@/components/avatar/Avatar.vue";

export default defineComponent({
  components: {
    Avatar,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    return {
      appStore,
      dataStore,
    };
  },
  methods: {
    toggleHideMutedChannels(id: string) {
      this.dataStore.toggleHideMutedChannels({ communityId: id });
    },
    muteCommunity(id: string) {
      this.dataStore.toggleCommunityMute({ communityId: id });
    },
    removeCommunity(id: string) {
      this.$router.push({ name: "home" }).then(() => {
        this.dataStore.removeCommunity({ communityId: id });
      });
    },
    handleCommunityClick(communityId: string) {
      if (this.communityIsActive(communityId)) {
        this.appStore.toggleSidebar;
      } else {
        this.appStore.setSidebar(true);
        this.$router.push({ name: "community", params: { communityId } });
      }
    },
  },
  computed: {
    communities() {
      return this.dataStore.getCommunities;
    },
    communityIsActive() {
      return (id: string) => this.$route.params.communityId === id;
    },
    hasNotification() {
      return (id: string) => {
        return this.dataStore.getCommunity(id)?.state?.hasNewMessages;
      };
    },
    getCommunityState() {
      return (id: string) => this.dataStore.getCommunityState(id);
    },
  },
});
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
