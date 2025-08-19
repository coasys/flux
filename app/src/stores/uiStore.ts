import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useMediaDevicesStore } from "./mediaDevicesStore";
import { VideoLayoutOption, WindowState } from "./types";

export const useUiStore = defineStore(
  "uiStore",
  () => {
    const mediaDevicesStore = useMediaDevicesStore();
    const { stream } = storeToRefs(mediaDevicesStore);

    const showAppSidebar = ref(true);
    const showCommunitySidebar = ref(true);
    const communitySidebarWidth = ref(400);
    const callWindowOpen = ref(false);
    const callWindowFullscreen = ref(false);
    const callWindowWidth = ref(0);
    const callWidgetsHeight = ref(0);
    const selectedVideoLayout = ref<VideoLayoutOption>({
      label: "16/9 aspect ratio",
      class: "16-by-9",
      icon: "aspect-ratio",
    });
    const focusedVideoId = ref("");
    const showGlobalLoading = ref(false);
    const globalError = ref({ show: false, message: "" });
    const windowState = ref<WindowState>("visible");
    const windowWidth = ref(window.innerWidth);

    const isMobile = computed(() => windowWidth.value < 800);

    // Mutations
    function toggleCommunitySidebar(): void {
      showCommunitySidebar.value = !showCommunitySidebar.value;
    }

    function toggleAppSidebar(): void {
      // Prevent width transition when toggling the app sidebar
      const mainAppLayout = document.getElementById("app-layout-main");
      if (mainAppLayout) mainAppLayout.style.transition = "none";

      // Toggle the app sidebar visibility
      showAppSidebar.value = !showAppSidebar.value;

      // Reset the transition after toggling
      if (mainAppLayout) setTimeout(() => (mainAppLayout.style.transition = "width 0.5s ease-in-out"), 200);
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

      // Desktop-specific width logic
      if (!isMobile.value) {
        const fullWidth = window.innerWidth - communitySidebarWidth.value - 100;
        setCallWindowWidth(open ? fullWidth / 2 : 0);
      }

      // Initialise a stream if the call window is opened without one
      if (open && !stream.value) mediaDevicesStore.createStream();
    }

    function setCallWindowFullscreen(isFullscreen: boolean): void {
      callWindowFullscreen.value = isFullscreen;
    }

    function toggleCallWindowFullscreen(): void {
      callWindowFullscreen.value = !callWindowFullscreen.value;

      // Update the call window width
      const fullWidth = window.innerWidth - communitySidebarWidth.value - 100;
      callWindowWidth.value = callWindowFullscreen.value ? fullWidth : fullWidth / 2;
    }

    function setCallWindowWidth(width: number): void {
      callWindowWidth.value = width;
    }

    function setVideoLayout(layout: VideoLayoutOption): void {
      selectedVideoLayout.value = layout;
    }

    function setFocusedVideoId(id: string) {
      focusedVideoId.value = id;
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

    function updateWindowWidth(): void {
      windowWidth.value = window.innerWidth;
    }

    function setCallWidgetsHeight(height: number): void {
      callWidgetsHeight.value = height;
    }

    return {
      // State
      isMobile,
      showAppSidebar,
      showCommunitySidebar,
      communitySidebarWidth,
      callWindowOpen,
      callWindowFullscreen,
      callWindowWidth,
      selectedVideoLayout,
      focusedVideoId,
      showGlobalLoading,
      globalError,
      windowState,
      callWidgetsHeight,

      // Actions
      toggleCommunitySidebar,
      toggleAppSidebar,
      setAppSidebarOpen,
      setCommunitySidebarOpen,
      setCommunitySidebarWidth,
      setCallWindowOpen,
      toggleCallWindowFullscreen,
      setCallWindowWidth,
      setVideoLayout,
      setFocusedVideoId,
      setWindowState,
      setGlobalLoading,
      setGlobalError,
      setCallWindowFullscreen,
      updateWindowWidth,
      setCallWidgetsHeight,
    };
  },
  {
    persist: {
      omit: [
        "showAppSidebar",
        "callWindowOpen",
        "callWindowWidth",
        "callWindowFullscreen",
        "selectedVideoLayout",
        "focusedVideoId",
        "callWidgetsHeight",
      ],
    },
  }
);
