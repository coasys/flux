<template>
  <div class="left-nav__communities-list">
    <div class="left-nav__divider"></div>
    <j-tooltip
      v-for="community in communities"
      :key="community.perspective.uuid"
      :title="community.name"
    >
      <j-popover event="contextmenu">
        <j-avatar
          slot="trigger"
          class="left-nav__community-item"
          :selected="communityIsActive(community.perspective.uuid)"
          size="xl"
          :online="hasNotification(community.perspective.uuid)"
          :src="community.image || null"
          :initials="community.name.charAt(0).toUpperCase()"
          @click="() => handleCommunityClick(community.perspective.uuid)"
        ></j-avatar>
        <j-menu slot="content">
          <j-menu-item
            @click="() => removeCommunity(community.perspective.uuid)"
            >Remove community</j-menu-item
          >

          <j-menu-item @click="() => muteCommunity(community.perspective.uuid)"
            ><j-icon
              size="xs"
              slot="start"
              :name="
                getCommunityState(community.perspective.uuid).notifications
                  ?.mute
                  ? 'bell-slash'
                  : 'bell'
              "
            />
            {{
              `${
                getCommunityState(community.perspective.uuid).notifications
                  ?.mute
                  ? "Unmute"
                  : "Mute"
              } Community`
            }}
          </j-menu-item>
          <j-menu-item
            @click="() => toggleHideMutedChannels(community.perspective.uuid)"
          >
            <j-icon
              size="xs"
              slot="start"
              :name="
                getCommunityState(community.perspective.uuid).hideMutedChannels
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
        size="xl"
        variant="subtle"
      >
        <j-icon size="lg" name="plus"></j-icon>
      </j-button>
    </j-tooltip>
  </div>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { DexieIPFS } from "@/utils/storageHelpers";
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const communities = ref(dataStore.getCommunityNeighbourhoods.map(e => ({...e, image: null})));

    return {
      appStore,
      dataStore,
      communities
    };
  },
  async mounted() {
    const updateCommunityListWithImage = async () => {
      let communities = this.dataStore.getCommunityNeighbourhoods;
      const tempCommunities = []

      for (const community of communities) {
        const tempCommunity = {...community};
        const dexie = new DexieIPFS(tempCommunity.perspective.uuid);
        if (tempCommunity.image) {
          const image = await dexie.get(tempCommunity.image!);
          tempCommunity.image = image
        }
        tempCommunities.push({...tempCommunity})
      }

      this.communities = tempCommunities;
    }

    updateCommunityListWithImage()

    watch(this.dataStore.neighbourhoods, () => setTimeout(() => updateCommunityListWithImage(), 500))
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
        this.dataStore.removeCommunity({communityId: id});
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

.left-nav__divider {
  width: 80%;
  margin: 0 auto;
  border-top: 1px solid var(--j-border-color);
}
</style>
