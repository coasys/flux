<template>
  <div class="left-nav__bottom-section">
    <j-tooltip id="myProfile" title="My profile">
      <j-popover event="click">
        <j-avatar
          class="left-nav__profile-icon"
          slot="trigger"
          size="xl"
          :hash="userDid"
          :src="userProfile.profilePicture"
        ></j-avatar>
        <j-menu slot="content">
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
              :hash="userDid"
              :src="userProfile.profilePicture"
            ></j-avatar>
            <j-text nomargin>{{ userProfile.username }}</j-text>
          </j-flex>
          <j-menu-item @click="() => setShowEditProfile(true)">
            <j-icon size="sm" slot="start" name="pencil"></j-icon>
            Edit profile
          </j-menu-item>
          <j-menu-item @click="updateApp.func">
            <j-icon size="sm" slot="start" name="cloud-download"></j-icon>
            {{ updateApp.text }}
          </j-menu-item>
          <j-menu-item @click="() => setShowSettings(true)">
            <j-icon size="sm" slot="start" name="gear"></j-icon>
            Settings
          </j-menu-item>
          <router-link :to="{ name: 'login' }" v-slot="{ navigate }">
            <j-menu-item @click="navigate">
              <j-icon size="sm" slot="start" name="door-closed"></j-icon>
              Log out
            </j-menu-item>
          </router-link>
        </j-menu>
      </j-popover>
    </j-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from "vue";
import { mapMutations } from "vuex";
import { Profile } from "@/store/types";

export default defineComponent({
  setup() {
    onBeforeMount(() => {
      window.api.receive("getCleanState", (data: string) => {
        localStorage.clear();

        window.api.send("quitApp");
      });
    });
  },
  methods: {
    ...mapMutations(["setShowSettings", "setShowEditProfile"]),
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
    userDid(): string {
      return this.$store.state.userDid;
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
  border-top: 1px solid var(--app-main-sidebar-border-color);
  padding: 2rem 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
}

.left-nav__profile-icon {
  cursor: pointer;
}
</style>
