import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useMediaDevicesStore } from "./mediaDevicesStore";
import { WindowState } from "./types";

export const useUiStore = defineStore(
  "uiStore",
  () => {
    const mediaDevicesStore = useMediaDevicesStore();
    const { stream } = storeToRefs(mediaDevicesStore);

    const showAppSidebar = ref(true);
    const showCommunitySidebar = ref(true);
    const communitySidebarWidth = ref(330);
    const callWindowOpen = ref(false);
    const callWindowFullscreen = ref(false);
    const callWindowWidth = ref("50%");
    const showGlobalLoading = ref(false);
    const globalError = ref({ show: false, message: "" });
    const windowState = ref<WindowState>("visible");

    // Mutations
    function toggleCommunitySidebar(): void {
      showCommunitySidebar.value = !showCommunitySidebar.value;
    }

    function toggleAppSidebar(): void {
      showAppSidebar.value = !showAppSidebar.value;
    }

    function setAppSidebarOpen(open: boolean): void {
      showAppSidebar.value = open;
    }

    function setCommunitySidebarOpen(open: boolean): void {
      showCommunitySidebar.value = open;
    }

    function setCommunitySidebarWidth(width: number): void {
      communitySidebarWidth.value = width;
    }

    function setCallWindowOpen(open: boolean): void {
      callWindowOpen.value = open;

      // Initialise a stream if the call window is opened without one
      if (open && !stream.value) mediaDevicesStore.createStream();
    }

    function setCallWindowFullscreen(isFullscreen: boolean): void {
      callWindowFullscreen.value = isFullscreen;
    }

    function toggleCallWindowFullscreen(): void {
      callWindowFullscreen.value = !callWindowFullscreen.value;
      if (callWindowFullscreen.value) callWindowWidth.value = "100%";
      else callWindowWidth.value = "50%";
    }

    function setCallWindowWidth(width: string): void {
      callWindowWidth.value = width;
    }

    function setWindowState(state: WindowState): void {
      windowState.value = state;
    }

    function setGlobalLoading(isLoading: boolean): void {
      showGlobalLoading.value = isLoading;
    }

    function setGlobalError(error: { show: boolean; message: string }): void {
      globalError.value = error;
    }

    return {
      // State
      showAppSidebar,
      showCommunitySidebar,
      communitySidebarWidth,
      callWindowOpen,
      callWindowFullscreen,
      callWindowWidth,
      showGlobalLoading,
      globalError,
      windowState,

      // Actions
      toggleCommunitySidebar,
      toggleAppSidebar,
      setAppSidebarOpen,
      setCommunitySidebarOpen,
      setCommunitySidebarWidth,
      setCallWindowOpen,
      toggleCallWindowFullscreen,
      setCallWindowWidth,
      setWindowState,
      setGlobalLoading,
      setGlobalError,
      setCallWindowFullscreen,
    };
  },
  { persist: { omit: ["callWindowOpen", "callWindowWidth"] } }
);
