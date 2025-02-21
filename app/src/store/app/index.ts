import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { ApplicationState } from "../types";
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state(): ApplicationState {
    return {
      updateState: "not-available",
      windowState: "visible",
      activeCommunity: "",
      activeChannel: "",
      modals: {
        showCreateCommunity: false,
        showEditCommunity: false,
        showCommunityMembers: false,
        showCreateChannel: false,
        showEditChannel: false,
        showEditProfile: false,
        showSettings: false,
        showCommunitySettings: false,
        showInviteCode: false,
        showDisclaimer: true,
        showCommunityTweaks: false,
        showLeaveCommunity: false,
      },
      showSidebar: true,
      showMainSidebar: true,
      sidebarWidth: 330,
      showGlobalLoading: false,
      globalTheme: {
        fontSize: "md",
        fontFamily: "DM Sans",
        name: "dark",
        hue: 270,
        saturation: 60,
      },
      currentTheme: "global",
      toast: {
        variant: "",
        message: "",
        open: false,
      },
      globalError: {
        show: false,
        message: "",
      },
      notification: {
        globalNotification: false,
      },
      activeWebrtc: {
        instance: undefined,
        channelId: "",
      }
    };
  },
  getters,
  actions: {
    ...mutations,
    ...actions,
  },
});
