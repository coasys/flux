<template>
  <j-box p="800">
    <j-box pb="500">
      <j-flex gap="500" a="center" j="between" wrap>
        <j-avatar
          style="--j-avatar-size: 150px"
          :src="user.profile.profilePicture"
          :hash="user.agent.did"
        />
        <j-button size="lg" @click="() => appStore.setShowEditProfile(true)">
          <j-icon size="sm" name="pencil" />
          Edit profile
        </j-button>
      </j-flex>
    </j-box>
    <j-box pb="500">
      <j-text size="600" color="ui-300">@{{ user.profile.username }}</j-text>
      <j-text variant="heading-lg"
        >{{ user.profile.givenName }} {{ user.profile.familyName }}</j-text
      >
    </j-box>
  </j-box>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { NeighbourhoodState, UserState } from "@/store/types";
import { useUserStore } from "@/store/user";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const userStore = useUserStore();
    const dataStore = useDataStore();
    const appStore = useAppStore();

    return {
      userStore,
      dataStore,
      appStore,
    };
  },
  computed: {
    communities(): NeighbourhoodState[] {
      return this.dataStore.getCommunityNeighbourhoods;
    },
    user(): UserState | null {
      return this.userStore.getUser;
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
