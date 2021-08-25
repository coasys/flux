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
          :src="community.image"
          :initials="community.name.charAt(0).toUpperCase()"
          @click="() => handleCommunityClick(community.perspective.uuid)"
        ></j-avatar>
        <j-menu
          slot="content"
          @click="() => removeCommunity(community.perspective.uuid)"
        >
          <j-menu-item>Remove community</j-menu-item>
        </j-menu>
      </j-popover>
    </j-tooltip>
    <j-tooltip title="Create a community">
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
import { NeighbourhoodState } from "@/store/types";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    return {
      appStore,
      dataStore,
    };
  },
  methods: {
    removeCommunity(id: string) {
      this.dataStore.removeCommunity(id);
      this.$router.push({ name: "home" });
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
    communities(): NeighbourhoodState[] {
      return this.dataStore.getCommunityNeighbourhoods;
    },
    communityIsActive() {
      return (id: string) => this.$route.params.communityId === id;
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
