<template>
  <button @click="$emit('click')" class="avatar-group">
    <j-tooltip title="See all members">
      <div class="avatar-group__avatars">
        <Avatar
          v-for="(user, index) in firstUsers"
          :data-testid="`avatar-group__avatar__${user.did}`"
          :key="index"
          :hash="user.did"
          :size="size"
          :url="user.profileThumbnailPicture"
        ></Avatar>

        <span v-if="users.length >= 5" class="avatar-group__see-all">
          +{{ users.length - 4 }}
        </span>
      </div>
    </j-tooltip>
  </button>
</template>

<script lang="ts">
import { Profile } from "@fluxapp/types";
import { getProfile } from "@fluxapp/api";
import { defineComponent } from "vue";
import Avatar from "@/components/avatar/Avatar.vue";

export default defineComponent({
  emits: ["click"],
  components: { Avatar },
  props: ["users", "size"],
  data() {
    return {
      firstUsers: {} as Record<string, Profile>,
      loading: false,
    };
  },
  watch: {
    users: {
      handler: async function (users: string[]) {
        // reset on change
        let firstUsers = {} as any;
        this.loading = true;

        for (let i = 0; i < users.length; i++) {
          const did = users[i];
          if (i <= 3) {
            const profile = await getProfile(did);
            if (profile) {
              firstUsers[did] = profile;
            }
          }
        }

        this.firstUsers = firstUsers;
        this.loading = false;
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
