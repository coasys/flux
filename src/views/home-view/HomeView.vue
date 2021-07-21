<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <div class="home-sidebar">
        <j-box px="500" pb="400">
          <j-text nomargin size="700" weight="500" color="ui-900">Home</j-text>
        </j-box>
        <j-box pb="800">
          <j-menu-item
            :selected="$route.name === 'my-communities'"
            @click="() => $router.push({ name: 'my-communities' })"
            size="lg"
          >
            <j-icon name="globe2" slot="start" />
            Communities
          </j-menu-item>
          <j-menu-item
            :selected="$route.name === 'settings'"
            @click="() => $router.push({ name: 'settings' })"
            size="lg"
          >
            <j-icon name="gear" slot="start" />
            Settings
          </j-menu-item>
        </j-box>
        <j-box>
          <j-menu-group-item title="About">
            <j-menu-item
              :selected="$route.name === 'junto-foundation'"
              @click="() => $router.push({ name: 'junto-foundation' })"
            >
              <j-icon size="sm" name="file-earmark-text" slot="start" />
              Junto Foundation
            </j-menu-item>
            <j-menu-item>
              <j-icon size="sm" name="lock" slot="start" />
              Privacy
            </j-menu-item>
            <j-menu-item>
              <j-icon size="sm" name="map" slot="start" />
              Roadmap
            </j-menu-item>
          </j-menu-group-item>
        </j-box>
      </div>
    </template>
    <router-view />
  </sidebar-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SidebarLayout from "@/layout/SidebarLayout.vue";

import { CommunityState } from "@/store";

export default defineComponent({
  name: "HomeView",
  components: { SidebarLayout },
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
  computed: {
    communities() {
      return this.$store.state.communities;
    },
    userProfile() {
      return this.$store.state.userProfile;
    },
  },
});
</script>

<style scoped>
.home-sidebar {
  padding-top: var(--j-space-800);
}
</style>
