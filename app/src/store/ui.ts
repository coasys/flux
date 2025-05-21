import type { CallWindowWidth, UIStore } from "@/store/types";
import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";

export const useUIStore = defineStore("ui", () => {
  const state = reactive<UIStore>({
    showAppSidebar: true,
    showCommunitySidebar: true,
    communitySidebarWidth: 330,
    callWindowOpen: false,
    callWindowWidth: "50%",
    showGlobalLoading: false,
    globalError: { show: false, message: "" },
    windowState: "visible",
  });

  // Mutations
  function toggleCommunitySidebar(): void {
    state.showCommunitySidebar = !state.showCommunitySidebar;
  }

  function toggleAppSidebar(): void {
    state.showAppSidebar = !state.showAppSidebar;
  }

  function setAppSidebarOpen(open: boolean): void {
    state.showAppSidebar = open;
  }

  function setCommunitySidebarOpen(open: boolean): void {
    state.showCommunitySidebar = open;
  }

  function setCommunitySidebarWidth(width: number): void {
    state.communitySidebarWidth = width;
  }

  function setCallWindowOpen(open: boolean): void {
    state.callWindowOpen = open;
  }

  function setCallWindowWidth(width: CallWindowWidth): void {
    state.callWindowWidth = width;
  }

  function setWindowState(payload: "minimize" | "visible" | "foreground"): void {
    state.windowState = payload;
  }

  function setGlobalLoading(payload: boolean): void {
    state.showGlobalLoading = payload;
  }

  function setGlobalError(payload: { show: boolean; message: string }): void {
    state.globalError = payload;
  }

  function toggleCallFullscreen() {
    state.callWindowWidth = state.callWindowWidth === "100%" ? "50%" : "100%";
  }

  return {
    // State
    ...toRefs(state),

    // Mutations
    toggleCommunitySidebar,
    toggleAppSidebar,
    setAppSidebarOpen,
    setCommunitySidebarOpen,
    setCommunitySidebarWidth,
    setCallWindowOpen,
    setCallWindowWidth,
    setWindowState,
    setGlobalLoading,
    setGlobalError,

    toggleCallFullscreen,
  };
});
