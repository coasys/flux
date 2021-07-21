<template>
  <div class="left-nav__communities-list">
    <j-tooltip
      v-for="community in communities"
      :key="community.perspective"
      :title="community.name"
    >
      <j-popover event="contextmenu">
        <j-avatar
          slot="trigger"
          class="left-nav__community-item"
          :selected="communityIsActive(community.perspective)"
          size="xl"
          :src="require('@/assets/images/junto_web_rainbow.png')"
          initials="false"
          @click="() => handleCommunityClick(community.perspective)"
        ></j-avatar>
        <j-menu
          slot="content"
          @click="() => removeCommunity(community.perspective)"
        >
          <j-menu-item>Remove community</j-menu-item>
        </j-menu>
      </j-popover>
    </j-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  methods: {
    removeCommunity(id: string) {
      this.$store.commit("removeCommunity", id);
      this.$router.push({ name: "home" });
    },
    handleCommunityClick(communityId: string) {
      if (this.communityIsActive(communityId)) {
        this.$store.commit("toggleSidebar");
      } else {
        this.$store.commit("setSidebar", true);
        this.$router.push({ name: "community", params: { communityId } });
      }
    },
  },
  computed: {
    communities() {
      return this.$store.state.communities;
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
  border-top: 1px solid var(--app-main-sidebar-border-color);
  padding-top: var(--j-space-500);
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
