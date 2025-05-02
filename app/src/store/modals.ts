import { ModalsStore } from "@/store/types";
import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";

export const useModalStore = defineStore("modals", () => {
  const state = reactive<ModalsStore>({
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
  });

  // Mutations
  function setShowCreateCommunity(payload: boolean): void {
    state.showCreateCommunity = payload;
  }

  function setShowEditCommunity(payload: boolean): void {
    state.showEditCommunity = payload;
  }

  function setShowCommunityMembers(payload: boolean): void {
    state.showCommunityMembers = payload;
  }

  function setShowCreateChannel(payload: boolean): void {
    state.showCreateChannel = payload;
  }

  function setShowEditProfile(payload: boolean): void {
    state.showEditProfile = payload;
  }

  function setShowDisclaimer(payload: boolean): void {
    state.showDisclaimer = payload;
  }

  function setShowSettings(payload: boolean): void {
    state.showSettings = payload;
  }

  function setShowCommunitySettings(payload: boolean): void {
    state.showCommunitySettings = payload;
  }

  function setShowCommunityTweaks(payload: boolean): void {
    state.showCommunityTweaks = payload;
  }

  function setShowEditChannel(show: boolean): void {
    state.showEditChannel = show;
  }

  function setShowLeaveCommunity(show: boolean): void {
    state.showLeaveCommunity = show;
  }

  function setShowInviteCode(payload: boolean): void {
    state.showInviteCode = payload;
  }

  return {
    // State
    ...toRefs(state),

    // Mutations
    setShowCreateCommunity,
    setShowEditCommunity,
    setShowCommunityMembers,
    setShowCreateChannel,
    setShowEditProfile,
    setShowDisclaimer,
    setShowSettings,
    setShowCommunitySettings,
    setShowCommunityTweaks,
    setShowEditChannel,
    setShowLeaveCommunity,
    setShowInviteCode,
  };
});
