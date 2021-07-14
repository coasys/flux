<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <div class="home-sidebar">
        <j-box pb="500">
          <router-link
            :to="{
              name: 'my-profile',
            }"
            custom
            v-slot="{ navigate, isExactActive }"
          >
            <j-menu-item :selected="isExactActive" size="lg" @click="navigate">
              <j-avatar
                size="xs"
                :hash="$store.state.userDid"
                :src="userProfile.profilePicture"
                slot="start"
              />
              {{ userProfile.name || userProfile.username }}
            </j-menu-item>
          </router-link>
          <router-link
            :to="{
              name: 'my-communities',
            }"
            custom
            v-slot="{ navigate, isExactActive }"
          >
            <j-menu-item :selected="isExactActive" size="lg" @click="navigate">
              <j-icon name="globe2" slot="start" />
              Communities
            </j-menu-item>
          </router-link>
          <router-link
            :to="{
              name: 'settings',
            }"
            custom
            v-slot="{ navigate, isExactActive }"
          >
            <j-menu-item :selected="isExactActive" size="lg" @click="navigate">
              <j-icon name="gear" slot="start" />
              Settings
            </j-menu-item>
          </router-link>
        </j-box>
      </div>
    </template>
    <j-box p="1000">
      <router-view />
    </j-box>
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
