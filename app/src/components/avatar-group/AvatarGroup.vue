<template>
  <button @click="emit('click')" class="avatar-group">
    <j-tooltip :title="tooltipTitle">
      <div class="avatars">
        <j-spinner size="sm" v-if="loading" />

        <j-avatar
          v-if="!loading"
          v-for="user in users.slice(0, 4)"
          :key="user.did"
          :hash="user.did"
          :src="user.profileThumbnailPicture"
          :size="size"
        />

        <span v-if="!loading && users.length > 4" class="see-all" :class="{ small: size === 'xs' }">
          +{{ users.length - 4 }}
        </span>
      </div>
    </j-tooltip>
  </button>
</template>

<script setup lang="ts">
defineProps<{ users: any[]; loading?: boolean; size?: string; tooltipTitle?: string }>();
const emit = defineEmits(["click"]);
</script>

<style lang="scss" scoped>
.avatar-group {
  outline: 0;
  border: 0;
  background: none;
  cursor: pointer;
  display: flex;
  padding: 0;

  .avatars {
    gap: var(--j-space-200);
    display: flex;
    align-items: center;
  }

  .avatars > *:not(:first-child) {
    margin-left: -15px;
    display: flex;
  }

  .see-all {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: 0;
    cursor: pointer;
    background: var(--j-color-ui-100);
    border: 1px solid transparent;
    border-radius: 50%;
    width: var(--j-size-md);
    font-size: var(--j-font-size-400);
    font-weight: 400;
    color: var(--j-color-ui-600);
    white-space: nowrap;
    padding: 14px;

    &.small {
      padding: 5px;
      width: 28px;
      height: 28px;
      font-size: 12px;
      margin-left: -3px;
    }
  }
}
</style>
