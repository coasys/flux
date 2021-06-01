<template>
  <div class="left-nav__bottom-section">
    <j-button size="xl" square circle variant="transparent">
      <j-icon :name="themeIcon"></j-icon>
    </j-button>

    <j-avatar
      id="myProfile"
      size="xl"
      :src="require('../../../src/assets/images/junto_app_icon.png')"
      initials="P"
    ></j-avatar>

    <j-popover event="click" selector="#myProfile">
      <j-menu>
        <j-flex
          a="center"
          gap="400"
          style="
            display: block;
            padding-left: var(--j-space-500);
            padding-right: var(--j-space-500);
            padding-bottom: var(--j-space-300);
            border-bottom: 1px solid var(--j-color-ui-100);
          "
        >
          <j-avatar initials="S"></j-avatar>
          <j-text nomargin>Username </j-text>
        </j-flex>
        <j-menu-item @click="isEditProfileOpen = true">
          Edit profile
        </j-menu-item>
        <j-menu-item>View profile</j-menu-item>
        <j-menu-item @click="isSettingsOpen = true">Settings</j-menu-item>
        <router-link :to="{ name: 'signup' }" v-slot="{ navigate }">
          <j-menu-item @click="navigate">Log out</j-menu-item>
        </router-link>
      </j-menu>
    </j-popover>

    <j-modal
      :open="isEditProfileOpen"
      @toggle="(e) => (isEditProfileOpen = e.target.open)"
    >
      <j-text variant="heading">Edit profile</j-text>
      <j-input label="Username"></j-input>
      <j-button variant="primary" full>Save</j-button>
    </j-modal>

    <j-modal
      :open="isSettingsOpen"
      @toggle="(e) => (isSettingsOpen = e.target.open)"
    >
      <j-text variant="heading">Settings</j-text>
      <j-select value="Dark" label="Theme">
        <j-menu-item>Light</j-menu-item>
        <j-menu-item>Dark</j-menu-item>
      </j-select>
      <j-button variant="primary" full>Save</j-button>
    </j-modal>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isSettingsOpen: false,
      isEditProfileOpen: false,
    };
  },
  computed: {
    profilePic() {
      const profile = this.$store.getters.getProfile;

      return profile.profilePicture;
    },
    currentTheme() {
      return this.$store.getters.getCurrentTheme;
    },
    themeIcon() {
      if (this.$store.state.currentTheme === "light") {
        return "sun";
      } else {
        return "moon";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.left-nav__bottom-section {
  width: 100%;
  border-top: 1px var(--j-color-ui-50) solid;
  padding: 2rem 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
