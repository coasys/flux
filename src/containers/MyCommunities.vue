<template>
  <j-box pb="1000">
    <j-flex wrap gap="500" a="center" j="between">
      <j-text nomargin variant="heading-lg">
        My communities ({{ Object.keys(communities).length }})
      </j-text>
      <j-button
        size="lg"
        variant="primary"
        @click="() => $store.commit('setShowCreateCommunity', true)"
        >Create a community</j-button
      >
    </j-flex>
  </j-box>
  <div class="community-items">
    <router-link
      :to="{
        name: 'community',
        params: { communityId: community.perspective },
      }"
      class="community-item"
      v-for="community in communities"
      :key="community.perspective"
    >
      <j-avatar
        :src="require('@/assets/images/junto_web_rainbow.png')"
        style="--j-avatar-size: 100px"
        size="xl"
      ></j-avatar>
      <div class="community-item__content">
        <j-text size="600" color="ui-800" weight="600">
          {{ community.name }}
        </j-text>
        <j-text variant="body">{{ community.description }}</j-text>
        <j-flex gap="300" a="center">
          <avatar-group
            size="xs"
            @click="() => handleMembersClick(community)"
            :users="community.members"
          />
          <j-text size="300" color="ui-500" nomargin>
            Members ({{ Object.keys(community.members).length }})
          </j-text>
        </j-flex>
      </div>
      <div>
        <j-button @click.prevent="() => handleEditClick(community)">
          <j-icon size="sm" name="pencil"></j-icon>
          Edit
        </j-button>
      </div>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { CommunityState } from "@/store";

export default defineComponent({
  components: { AvatarGroup },
  computed: {
    communities() {
      return this.$store.state.communities;
    },
  },
  methods: {
    handleMembersClick(community: CommunityState) {
      this.$store.commit("setShowCommunityMembers", true);
      this.$router.push({
        name: "community",
        params: { communityId: community.perspective },
      });
    },
    handleEditClick(community: CommunityState) {
      this.$store.commit("setShowEditCommunity", true);
      this.$router.push({
        name: "community",
        params: { communityId: community.perspective },
      });
    },
  },
});
</script>

<style scoped>
.community-items {
  display: grid;
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-border-color);
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
  padding: var(--j-space-500);
  border-bottom: 1px solid var(--j-border-color);
  transition: all 0.2s ease;
}

.community-item__content {
  flex: 1;
}

.community-item:hover {
  background: var(--j-color-ui-50);
}
</style>
