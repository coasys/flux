<template>
  <div class="left-nav__bottom-section">
    <j-tooltip id="myProfile" title="My profile">
      <j-popover
        event="click"
        :open="showBottomOptions"
        @toggle="(e) => (showBottomOptions = e.target.open)"
      >
        <j-avatar
          class="left-nav__profile-icon"
          slot="trigger"
          size="xl"
          :hash="userDid"
          :src="userProfile?.profilePicture"
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
              :src="userProfile?.profilePicture"
            ></j-avatar>
            <j-text nomargin>{{ userProfile?.username }}</j-text>
          </j-flex>
          <j-menu-item @click="() => setShowEditProfile(true)">
            <j-icon size="sm" slot="start" name="pencil"></j-icon>
            Edit profile
          </j-menu-item>
          <j-menu-item @click="updateApp.func">
            <j-icon size="sm" slot="start" name="cloud-download"></j-icon>
            {{ updateApp.text }}
          </j-menu-item>
          <j-menu-item @click="goToSettings">
            <j-icon size="sm" slot="start" name="gear"></j-icon>
            Settings
          </j-menu-item>
          <!-- TODO: Wee need to lock the user first
          <j-menu-item @click="logOut">
            <j-icon size="sm" slot="start" name="door-closed"></j-icon>
            Log out
          </j-menu-item>
          -->
        </j-menu>
      </j-popover>
    </j-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from "vue";
import { Profile } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions } from "pinia";

export default defineComponent({
  setup() {
    const appStore = useAppStore();
    const userStore = useUserStore();

    onBeforeMount(() => {
      window.api.receive("getCleanState", (data: string) => {
        localStorage.clear();

        window.api.send("quitApp");
      });
    });

    return {
      appStore,
      userStore,
    };
  },
  data() {
    return {
      showBottomOptions: false,
    };
  },
  methods: {
    ...mapActions(useAppStore, ["setShowEditProfile", "setShowSettings"]),
    logOut(): void {
      this.$router.replace({ name: "login" });
    },
    checkForUpdates() {
      window.api.send("check-update");
      this.appStore.setUpdateState({ updateState: "checking" });
    },
    downloadUpdates() {
      window.api.send("download-update");
      this.appStore.setUpdateState({ updateState: "downloading" });
    },
    installNow() {
      window.api.send("quit-and-install");
    },
    goToSettings() {
      this.$router.push({ name: "settings" });
      this.showBottomOptions = false;
    },
  },
  computed: {
    userProfile(): Profile | null {
      return this.userStore.profile;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
    updateApp(): { text: string; func?: () => void } {
      const state = this.appStore.updateState;

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
