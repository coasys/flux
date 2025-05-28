import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useMediaDevicesStore } from "./mediaDevicesStore";

export type WindowState = "minimize" | "visible" | "foreground";

export const useUiStore = defineStore(
  "uiStore",
  () => {
    const mediaDevicesStore = useMediaDevicesStore();
    const { mediaPermissions, mediaSettings, stream } = storeToRefs(mediaDevicesStore);

    const showAppSidebar = ref(true);
    const showCommunitySidebar = ref(true);
    const communitySidebarWidth = ref(330);
    const callWindowOpen = ref(false);
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

      // Request media permissions when opened if not already granted or requested
      if (open) {
        // !stream.value &&
        console.log("mediaPermissions.value", mediaPermissions.value);
        // const { camera, microphone } = mediaPermissions.value;
        // const needsRequested = !camera.granted && !camera.requested && !microphone.granted && !microphone.requested;
        // if (needsRequested) mediaDevicesStore.getStream();
        if (!stream.value) mediaDevicesStore.getStream();
      }
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

    function toggleCallFullscreen() {
      // Use the channel view width to determine the full screen state incase manually resized
      const channelViewWidth = document.getElementById("channel-view")?.getBoundingClientRect().width;
      callWindowWidth.value = channelViewWidth ? "100%" : "50%";
    }

    return {
      // State
      showAppSidebar,
      showCommunitySidebar,
      communitySidebarWidth,
      callWindowOpen,
      callWindowWidth,
      showGlobalLoading,
      globalError,
      windowState,

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
  },
  { persist: true }
);
