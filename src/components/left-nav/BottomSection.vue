<template>
  <div class="left-nav__bottom-section">
    <toggle-theme-button></toggle-theme-button>
    <profile-avatar diameter="5"></profile-avatar>
  </div>
</template>

<script lang="ts">
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
  background-color: var(--junto-background-color);
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
