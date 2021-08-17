<template>
  <j-box px="800" pt="800" pb="1000">
    <j-flex wrap gap="500" a="center" j="between">
      <j-text nomargin variant="heading-sm">
        My communities ({{ communities.length }})
      </j-text>
      <j-button size="lg" variant="primary" @click="createCommunityClick"
        >Create a community</j-button
      >
    </j-flex>
  </j-box>
  <div class="community-items">
    <router-link
      :to="{
        name: 'community',
        params: { communityId: community.perspective.uuid },
      }"
      class="community-item"
      v-for="community in communities"
      :key="community.perspective.uuid"
    >
      <j-avatar
        :src="community.image"
        :initials="community.name.charAt(0)"
        size="xl"
      ></j-avatar>
      <div class="community-item__content">
        <j-text size="600" nomargin color="ui-800" weight="600">
          {{ community.name }}
        </j-text>
        <j-text nomargin variant="body">{{ community.description }}</j-text>
        <j-flex gap="300" a="center">
          <j-text size="400">
            {{ Object.keys(community.members).length }} Members
          </j-text>
        </j-flex>
      </div>
      <div>
        <j-button
          variant="subtle"
          @click.prevent="() => handleEditClick(community)"
        >
          <j-icon size="sm" name="pencil"></j-icon>
          Edit
        </j-button>
      </div>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { NeighbourhoodState } from "@/store/types";
import store from "@/store";

export default defineComponent({
  computed: {
    communities() {
      return store.getters.getCommunityNeighbourhoods;
    },
  },
  methods: {
    createCommunityClick() {
      store.commit.setShowCreateCommunity(true);
    },
    handleMembersClick(community: NeighbourhoodState) {
      store.commit.setShowCommunityMembers(true);
      this.$router.push({
        name: "community",
        params: { communityId: community.perspective.uuid },
      });
    },
    handleEditClick(community: NeighbourhoodState) {
      store.commit.setShowEditCommunity(true);
      this.$router.push({
        name: "community",
        params: { communityId: community.perspective.uuid },
      });
    },
  },
});
</script>

<style scoped>
.community-items {
  display: grid;
  border-radius: var(--j-border-radius);
  grid-template-columns: 1fr;
}

.community-item {
  text-decoration: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--j-space-700);
  align-items: center;
  height: 100%;
  cursor: pointer;
  width: 100%;
  justify-content: space-between;
  padding: var(--j-space-500) var(--j-space-800);
  border-bottom: 1px solid var(--j-border-color);
  transition: all 0.2s ease;
}

.community-item__content {
  flex: 1;
}

.community-item:first-of-type {
  border-top: 1px solid var(--j-border-color);
}

.community-item:hover {
  background: rgba(128, 128, 128, 0.05);
}
</style>
