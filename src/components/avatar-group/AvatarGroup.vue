<template>
  <button @click="$emit('click')" class="avatar-group">
    <j-tooltip title="See all members">
      <div class="avatar-group__avatars">
        <j-avatar
          v-for="(user, index) in firstUsers"
          :key="index"
          :src="require('@/assets/images/junto_app_icon.png')"
          size="sm"
        ></j-avatar>
        <span v-if="users.length >= 4" class="avatar-group__see-all">
          + {{ users.length - 3 }}
        </span>
      </div>
    </j-tooltip>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["click"],
  props: ["users"],
  computed: {
    firstUsers(): any {
      return [{ ...this.users[0] }, { ...this.users[1] }, { ...this.users[2] }];
    },
  },
});
</script>

<style scoped>
.avatar-group {
  outline: 0;
  border: 0;
  background: none;
  width: 100%;
  display: flex;
}

.avatar-group__avatars {
  gap: var(--j-space-200);
  display: inline-flex;
}

.avatar-group__avatars > *:not(:first-child) {
  margin-left: -15px;
}

.avatar-group__see-all {
  display: flex;
  align-items: center;
  justify-content: center;
  outline: 0;
  cursor: pointer;
  background: var(--j-color-white);
  border: 1px solid var(--j-color-primary-500);
  border-radius: 50%;
  height: var(--j-element-sm);
  width: var(--j-element-sm);
  font-size: var(--j-font-size-100);
  color: var(--j-color-primary-500);
  white-space: nowrap;
}
</style>
