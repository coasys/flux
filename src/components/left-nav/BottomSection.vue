<template>
  <div class="left-nav__bottom-section">
    <toggle-theme-button></toggle-theme-button>
    <profile-avatar diameter="5"></profile-avatar>
  </div>
</template>

<script>
import ProfileAvatar from "./../ui/avatar/ProfileAvatar.vue";
import ToggleThemeButton from "./../ui/theme/ToggleThemeButton.vue";

export default {
  components: { ProfileAvatar, ToggleThemeButton },
};
</script>

<style lang="scss" scoped>
.left-nav__bottom-section {
  width: 100%;
  border-top: 1px var(--junto-border-color) solid;
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>