<template>
  <div class="directMessageMeta">
    <div class="directMessageMeta__sender">
      <profile-avatar :diameter="3"></profile-avatar>
      <img src="" alt="" class="directMessageMeta__sender--icon" />
      <p class="directMessageMeta__sender--username">{{ message.username }}</p>
    </div>
  </div>
</template>

<script>
import ProfileAvatar from "../../ui/avatar/ProfileAvatar.vue";
export default {
  props: ["message"],
  components: {
    ProfileAvatar,
  },
};
</script>

<style lang="scss" scoped>
.directMessageMeta {
  display: flex;

  &__sender {
    display: flex;
    align-items: center;

    &--username {
      font-size: 1.4rem;
      font-weight: 700;
      margin-left: .5rem;
      color: var(--junto-primary);
    }
  }

  &__timestamp {
    font-size: 1.2rem;
  }
}
</style>