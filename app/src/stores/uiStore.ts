import { defineStore, storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useMediaDevicesStore } from './mediaDevicesStore';
import { VideoLayoutOption, WindowState } from './types';
import { BREAKPOINTS } from '@/constants/breakpoints';

export const useUiStore = defineStore(
  'uiStore',
  () => {
    const mediaDevicesStore = useMediaDevicesStore();
    const { stream } = storeToRefs(mediaDevicesStore);

    const appSidebarWidth = ref(100);
    const communitySidebarWidth = ref(400);
    const headerHeight = ref(60);
    const showAppSidebar = ref(true);
    const showCommunitySidebar = ref(true);
    const callWindowOpen = ref(false);
    const callWindowFullscreen = ref(false);
    const callWindowWidth = ref(0);
    const callWidgetsHeight = ref(0);
    const selectedVideoLayout = ref<VideoLayoutOption>({
      label: '16/9 aspect ratio',
      class: '16-by-9',
      icon: 'aspect-ratio',
    });
    const focusedVideoId = ref('');
    const showGlobalLoading = ref(false);
    const globalError = ref({ show: false, message: '' });
    const windowState = ref<WindowState>('visible');
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const orientation = ref<'portrait' | 'landscape'>(
      window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    );

    const isMobile = computed(() => windowWidth.value <= BREAKPOINTS.MOBILE);
    const isLandscapeMobile = computed(() => isMobile.value && orientation.value === 'landscape');

    // Mutations
    function toggleCommunitySidebar(): void {
      showCommunitySidebar.value = !showCommunitySidebar.value;
    }

    function toggleAppSidebar(): void {
      // Prevent width transition when toggling the app sidebar
      const mainAppLayout = document.getElementById('app-layout-main');
      if (mainAppLayout) mainAppLayout.style.transition = 'none';

      // Toggle the app sidebar visibility
      showAppSidebar.value = !showAppSidebar.value;

      // Reset the transition after toggling
      if (mainAppLayout) setTimeout(() => (mainAppLayout.style.transition = 'width 0.5s ease-in-out'), 200);
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
        const fullWidth = window.innerWidth - communitySidebarWidth.value - appSidebarWidth.value;
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
      const fullWidth = window.innerWidth - communitySidebarWidth.value - appSidebarWidth.value;
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
      if (typeof window !== 'undefined') {
        windowWidth.value = window.innerWidth;
      }
    }

    function setCallWidgetsHeight(height: number): void {
      callWidgetsHeight.value = height;
    }

    function updateOrientation() {
      orientation.value = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    // Setup resize listeners
    const handleResize = () => {
      updateWindowWidth();
      updateOrientation();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
    }

    watch(isMobile, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if (newValue) {
          // Set call window width to 100% of the screen so video grid updates
          setCallWindowWidth(windowWidth.value);
        } else {
          // Revert call window width to desktop mode
          const fullWidth = window.innerWidth - communitySidebarWidth.value - appSidebarWidth.value;
          callWindowWidth.value = callWindowFullscreen.value ? fullWidth : fullWidth / 2;
        }
      }
    })

    return {
      // State
      appSidebarWidth,
      headerHeight,
      communitySidebarWidth,
      isMobile,
      isLandscapeMobile,
      showAppSidebar,
      showCommunitySidebar,
      callWindowOpen,
      callWindowFullscreen,
      callWindowWidth,
      selectedVideoLayout,
      focusedVideoId,
      showGlobalLoading,
      globalError,
      windowState,
      callWidgetsHeight,
      orientation,

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
        'showAppSidebar',
        'callWindowOpen',
        'callWindowWidth',
        'callWindowFullscreen',
        'selectedVideoLayout',
        'focusedVideoId',
        'callWidgetsHeight',
      ],
    },
  },
);
