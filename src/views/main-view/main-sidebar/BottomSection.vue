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
          <j-icon size="sm" slot="start" name="pencil"></j-icon>
          Edit profile
        </j-menu-item>
        <j-menu-item @click="updateApp.func">
          <j-icon size="sm" slot="start" name="cloud-download"></j-icon>
          {{ updateApp.text }}
        </j-menu-item>
        <j-menu-item @click="isSettingsOpen = true">
          <j-icon size="sm" slot="start" name="gear"></j-icon>
          Settings
        </j-menu-item>
        <router-link :to="{ name: 'signup' }" v-slot="{ navigate }">
          <j-menu-item @click="navigate">
            <j-icon size="sm" slot="start" name="door-closed"></j-icon>
            Log out
          </j-menu-item>
        </router-link>
      </j-menu>
    </j-popover>

    <j-modal
      :open="isEditProfileOpen"
      @toggle="(e) => (isEditProfileOpen = e.target.open)"
    >
      <edit-profile
        @submit="isEditProfileOpen = false"
        @cancel="isEditProfileOpen = false"
      />
    </j-modal>

    <j-modal
      class="settings-modal"
      :open="isSettingsOpen"
      @toggle="(e) => (isSettingsOpen = e.target.open)"
    >
      <settings
        @submit="isSettingsOpen = false"
        @cancel="isSettingsOpen = false"
      />
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from "vue";
import Settings from "@/containers/Settings.vue";
import EditProfile from "@/containers/EditProfile.vue";
import { Profile } from "@/store";

export default defineComponent({
  components: { Settings, EditProfile },
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
      isSettingsOpen: false,
      isEditProfileOpen: false,
    };
  },

  methods: {
    cleanState() {
      window.api.send("cleanState");
    },
    checkForUpdates() {
      window.api.send("check-update");
      this.$store.commit("updateUpdateState", { updateState: "checking" });
    },
    downloadUpdates() {
      window.api.send("download-update");
      this.$store.commit("updateUpdateState", { updateState: "downloading" });
    },
    installNow() {
      window.api.send("quit-and-install");
    },
  },
  computed: {
    userProfile(): Profile {
      return this.$store.state.userProfile || {};
    },
    updateApp(): { text: string; func?: () => void } {
      const state = this.$store.state.updateState;

      let text = "Check for updates";
      let func: undefined | (() => void) = this.checkForUpdates;

      if (state === "available") {
        text = "Download now";
        func = this.downloadUpdates;
      } else if (state === "not-available") {
        text = "Check for updates";
      } else if (state === "checking") {
        text = "Checking for updates";
        func = undefined;
      } else if (state === "downloading") {
        text = "Downloading update";
        func = undefined;
      } else if (state === "downloaded") {
        text = "Update downloaded, install now";
        func = this.installNow;
      }

      return {
        text,
        func,
      };
    },
  },
});
</script>

<style lang="scss" scoped>
.left-nav__bottom-section {
  width: 100%;
  border-top: 1px var(--app-drawer-border-color) solid;
  padding: 2rem 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
}
</style>
