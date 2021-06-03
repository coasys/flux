<template>
  <div class="left-nav__bottom-section">
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
          <j-text nomargin>{{ userProfile?.username }} </j-text>
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
      <j-flex direction="column" gap="700">
        <j-text variant="heading">Edit profile</j-text>
        <j-input
          size="lg"
          label="Username"
          :value="userProfile?.username"
          @input="(e) => setUserProfile({ username: e.target.value })"
        ></j-input>
        <j-button size="lg" variant="primary" full>Save</j-button>
      </j-flex>
    </j-modal>

    <j-modal
      :open="isSettingsOpen"
      @toggle="(e) => (isSettingsOpen = e.target.open)"
    >
      <j-flex direction="column" gap="700">
        <j-text variant="heading">Settings</j-text>
        <j-select
          :value="theme"
          @change="(e) => (theme = e.target.value)"
          label="Theme"
        >
          <j-menu-item value="light">Light</j-menu-item>
          <j-menu-item value="dark">Dark</j-menu-item>
        </j-select>
        <div>
          <j-text variant="label">Primary color</j-text>
          <input
            style="display: block; width: 100%"
            type="range"
            :value="hue"
            min="0"
            max="359"
            @input="(e) => (hue = e.target.value)"
          />
        </div>
        <j-button full size="lg" variant="primary">Save</j-button>
      </j-flex>
    </j-modal>
  </div>
</template>

<script>
export default {
  data() {
    return {
      hue: getComputedStyle(document.documentElement).getPropertyValue(
        "--j-color-primary-hue"
      ),
      theme: "light",
      isSettingsOpen: false,
      isEditProfileOpen: false,
    };
  },
  watch: {
    hue: function (val) {
      document.documentElement.style.setProperty("--j-color-primary-hue", val);
    },
    theme: function (val) {
      document.documentElement.setAttribute("theme", val);
    },
  },
  methods: {
    setUserProfile(profile) {
      this.$store.commit("setUserProfile", profile);
    },
  },
  computed: {
    profilePic() {
      const profile = this.$store.getters.getProfile;

      return profile.profilePicture;
    },
    userProfile() {
      return this.$store.state.userProfile;
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
