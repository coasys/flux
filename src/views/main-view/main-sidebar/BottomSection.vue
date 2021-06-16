<template>
  <div class="left-nav__bottom-section">
    <j-avatar
      id="myProfile"
      size="xl"
      :src="
        userProfile.profilePicture ||
        require('@/assets/images/avatar-placeholder.png')
      "
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
          <j-avatar
            :src="
              userProfile.profilePicture ||
              require('@/assets/images/avatar-placeholder.png')
            "
          ></j-avatar>
          <j-text nomargin>{{ userProfile.username }}</j-text>
        </j-flex>
        <j-menu-item @click="isEditProfileOpen = true">
          Edit profile
        </j-menu-item>
        <j-menu-item>View profile</j-menu-item>
        <j-menu-item @click="updateApp.func">{{ updateApp.text }}</j-menu-item>
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
        <avatar-upload
          :value="profilePicture"
          @change="(url) => (profilePicture = url)"
        ></avatar-upload>
        <j-input
          size="lg"
          label="Username"
          @keydown.enter="updateUser"
          :value="userProfile?.username"
          @input="(e) => (username = e.target.value)"
        ></j-input>
        <j-button size="lg" variant="primary" @click="updateUser" full>
          Save
        </j-button>
      </j-flex>
    </j-modal>

    <j-modal
      :open="isSettingsOpen"
      @toggle="(e) => (isSettingsOpen = e.target.open)"
    >
      <j-flex direction="column" gap="700">
        <j-text variant="heading">Settings</j-text>
        <j-select
          :value="themeName"
          @change="(e) => (themeName = e.target.value)"
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
            :value="themeHue"
            min="0"
            max="359"
            @input="(e) => (themeHue = e.target.value)"
          />
        </div>
        <j-flex a="center" j="between">
        <j-text variant="label">Clear State</j-text>
          <j-button size="md" variant="primary" @click="cleanState">
            clear
          </j-button>
        </j-flex>
        <div>
          <j-button size="lg" @click="isSettingsOpen = false">Cancel</j-button>
          <j-button size="lg" variant="primary" @click="updateTheme">
            Save
          </j-button>
        </div>
      </j-flex>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from "vue";
import { Profile, ThemeState } from "@/store";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";

import { dataURItoBlob } from "@/core/methods/createProfile";

export default defineComponent({
  components: { AvatarUpload },
  setup() {
    onBeforeMount(() => {
      window.api.receive("getCleanState", (data: string) => {
        localStorage.clear();

        window.api.send("quitApp");
      });
    });
  },
  data() {
    return {
      hue: getComputedStyle(document.documentElement).getPropertyValue(
        "--j-color-primary-hue"
      ),
      isSettingsOpen: false,
      isEditProfileOpen: false,
      isUpdatingProfile: false,
      username: "",
      profilePicture: "",
      themeName: "",
      themeHue: "",
    };
  },
  watch: {
    isSettingsOpen: function (val) {
      if (!val) {
        this.resetTheme();
      }
    },
    themeHue: function (val) {
      document.documentElement.style.setProperty("--j-color-primary-hue", val);
    },
    themeName: function (val) {
      document.documentElement.setAttribute("theme", val);
    },
    "userProfile.profilePicture": {
      handler: function (val: string): void {
        this.profilePicture = val;
      },
      immediate: true,
    },
    "userProfile.username": {
      handler: function (val: string): void {
        this.username = val;
      },
      immediate: true,
    },
    "theme.name": {
      handler: function (val: string): void {
        this.themeName = val;
      },
      immediate: true,
    },
    "theme.hue": {
      handler: function (val: string): void {
        this.themeHue = val;
      },
      immediate: true,
    },
  },
  methods: {
    resetTheme() {
      this.$store.commit("setTheme", {
        name: this.theme.name,
        hue: this.theme.hue,
      });
    },
    updateTheme() {
      this.$store.commit("setTheme", {
        name: this.themeName,
        hue: this.themeHue,
      });
      this.isSettingsOpen = false;
    },
    updateUser() {
      this.isUpdatingProfile = true;
      this.$store
        .dispatch("updateUser", {
          username: this.username,
          profilePicture: this.profilePicture,
        })
        .then(() => {
          this.isEditProfileOpen = false;
        })
        .finally(() => {
          this.isUpdatingProfile = false;
        });
    },
    cleanState() {
      window.api.send("cleanState");
    },
    checkForUpdates() {
      window.api.send("check-update");
      this.$store.commit("updateUpdateState", { updateState: "checking" });
    },
    downloadUpdates() {
      window.api.send("download-update");
    },
    installNow() {
      window.api.send("quit-and-install");
    }
  },
  computed: {
    theme(): ThemeState {
      return this.$store.state.ui.theme;
    },
    userProfile(): Profile {
      return this.$store.state.userProfile || {};
    },
    updateApp(): {text: string, func?: () => void} {
      const state = this.$store.state.updateState;

      let text = 'Check for updates';
      let func: undefined | (() => void) = this.checkForUpdates;

      if (state === 'available') {
        text = 'Update available';
        func = this.downloadUpdates;
      } else if (state === 'not-available') {
        text = 'Check for updates';
      } else if (state === 'checking') {
        text = 'Checking for updates';
        func = undefined;
      } else if (state === 'downloading') {
        text = 'Downloading update';
        func = undefined;
      } else if (state === 'downloaded') {
        text = 'Update downloaded, install now';
        func = this.installNow;
      } 

      return {
        text,
        func
      };
    }
  },
});
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
}
</style>
