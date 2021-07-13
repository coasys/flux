<template>
  <button @click="$emit('click')" class="avatar-group">
    <j-tooltip title="See all members">
      <div class="avatar-group__avatars">
        <j-avatar
          class="avatar-group__avatar"
          v-for="(user, index) in firstUsers"
          :key="index"
          :hash="user.author.did"
          :size="size"
          :src="
            user.data.profile['schema:image']
              ? JSON.parse(user.data.profile['schema:image'])[
                  'schema:contentUrl'
                ]
              : null
          "
        ></j-avatar>
        <span v-if="users.length >= 4" class="avatar-group__see-all">
          +{{ users.length - 3 }}
        </span>
      </div>
    </j-tooltip>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["click"],
  props: ["users", "size"],
  computed: {
    firstUsers(): any {
      return (this.users as any[]).slice(0, 3);
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
