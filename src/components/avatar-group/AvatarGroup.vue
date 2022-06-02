<template>
  <button @click="$emit('click')" class="avatar-group">
    <j-tooltip title="See all members">
      <div class="avatar-group__avatars">
        <template v-if="!loading">
          <j-avatar
            class="avatar-group__avatar"
            v-for="(user, index) in firstUsers"
            :data-testid="`avatar-group__avatar__${user.did}`"
            :key="index"
            :hash="user.did"
            :size="size"
            :src="user.thumbnailPicture"
          ></j-avatar>
        </template>
        <template v-if="loading">
          <Skeleton
            v-for="i in 3"
            :key="i"
            variant="circle"
            width="var(--j-size-md)"
            height="var(--j-size-md)"
          ></Skeleton>
        </template>
        <span v-if="users.length >= 4" class="avatar-group__see-all">
          +{{ users.length - 3 }}
        </span>
      </div>
    </j-tooltip>
  </button>
</template>

<script lang="ts">
import { ProfileWithDID } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { defineComponent } from "vue";
import Skeleton from "@/components/skeleton/Skeleton.vue";

export default defineComponent({
  emits: ["click"],
  components: { Skeleton },
  props: ["users", "size"],
  data() {
    return {
      firstUsers: [] as ProfileWithDID[],
      loading: false,
    };
  },
  watch: {
    users: {
      handler: async function (users) {
        // reset on change
        this.firstUsers = [];
        this.loading = true;
        for (const user of users.slice(0, 3)) {
          if (user) {            
            const member = await getProfile(user);
  
            if (member) {
              this.firstUsers = [...this.firstUsers, member];
            }
          }
        }
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
}

.avatar-group__avatars {
  gap: var(--j-space-200);
  display: inline-flex;
}

.avatar-group__avatar {
  border-radius: 50%;
  background: var(--j-color-white);
}

.avatar-group__avatars > *:not(:first-child) {
  margin-left: -15px;
}

.avatar-group__see-all {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: 0;
  cursor: pointer;
  background: var(--j-color-white);
  border: 0.25px solid var(--j-border-color);
  border-radius: 50%;
  height: var(--j-size-sm);
  width: var(--j-size-sm);
  font-size: var(--j-font-size-300);
  font-weight: 500;
  color: var(--j-color-ui-400);
  white-space: nowrap;
  padding: 14px;
}
</style>
