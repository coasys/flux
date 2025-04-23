<template>
  <button @click="$emit('click')" class="avatar-group">
    <j-tooltip title="See all members">
      <div class="avatar-group__avatars">
        <j-spinner size="sm" v-if="loading" />

        <Avatar
          v-if="!loading"
          v-for="user in firstUsers"
          :key="user.did"
          :did="user.did"
          :url="user.profileThumbnailPicture"
          :size="size"
        />

        <span v-if="!loading && users.length > 4" class="avatar-group__see-all">
          +{{ users.length - 4 }}
        </span>
      </div>
    </j-tooltip>
  </button>
</template>

<script lang="ts">
import { Profile } from "@coasys/flux-types";
import { getProfile } from "@coasys/flux-api";
import { defineComponent } from "vue";
import Avatar from "@/components/avatar/Avatar.vue";

export default defineComponent({
  emits: ["click"],
  components: { Avatar },
  props: ["loading", "users", "size"],
  data() {
    return { firstUsers: [] as Profile[] | { did: string, profileThumbnailPicture: string }[] };
  },
  watch: {
    users: {
      handler: async function (users: string[]) {
        const newUsers = users.slice(0, 4);
        // Immediatly display the first 4 users identicons via their dids
        this.firstUsers = newUsers.map((did) => ({ did, profileThumbnailPicture: '' }));
        // Update their images when they are available
        this.firstUsers = await Promise.all(newUsers.map(async (did) => await getProfile(did) || { did, profileThumbnailPicture: '' }));
      },
      immediate: true,
      deep: true,
    },
  },
});
</script>

<style scoped>
.avatar-group {
  outline: 0;
  border: 0;
  background: none;
  cursor: pointer;
  display: flex;
  min-height: var(--j-size-md);
}

.avatar-group__avatars {
  gap: var(--j-space-200);
  display: flex;
  height: var(--j-size-md);
}

.avatar-group__avatars > *:not(:first-child) {
  margin-left: -15px;
  display: flex;
}

.avatar-group__see-all {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: 0;
  cursor: pointer;
  background: var(--j-color-ui-100);
  border: 1px solid transparent;
  border-radius: 50%;
  height: var(--j-size-md);
  width: var(--j-size-md);
  font-size: var(--j-font-size-400);
  font-weight: 400;
  color: var(--j-color-ui-600);
  white-space: nowrap;
  padding: 14px;
}
</style>
