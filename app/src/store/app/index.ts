import iconPath from "@/assets/images/icon.png";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { ApplicationState, ThemeState, ToastState, UpdateState } from "@/store/types";
import { setTheme } from "@/utils/themeHelper";
import { Ad4mClient, Agent } from "@coasys/ad4m";
import { joinCommunity } from "@coasys/flux-api";
import { defineStore } from "pinia";
import { computed, reactive, shallowRef, toRefs } from "vue";

export const useAppStore = defineStore("app", () => {
  // Store a shallow ref of the Ad4mClient so we retain access to its methods
  const ad4mClientRef = shallowRef<Ad4mClient | null>(null);

  // Wrap the Ad4mClient in a computed property to prevent access before initialization and avoid null checks
  const ad4mClient = computed(() => {
    if (!ad4mClientRef.value) console.error("Trying to access Ad4mClient before initialization");
    return ad4mClientRef.value as Ad4mClient;
  });

  // State
  const state = reactive<ApplicationState>({
    me: { did: "" },
    updateState: "not-available",
    windowState: "visible",
    activeCommunityId: "",
    activeChannelId: "",
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
    globalTheme: { fontSize: "md", fontFamily: "DM Sans", name: "dark", hue: 270, saturation: 60 },
    currentTheme: "global",
    toast: { variant: "", message: "", open: false },
    globalError: { show: false, message: "" },
    notification: { globalNotification: false },
    activeWebrtc: { instance: undefined, channelId: "" },
  });

  // Mutations
  function setAdamClient(client: Ad4mClient): void {
    ad4mClientRef.value = client;
  }

  function setMe(me: Agent): void {
    state.me = me;
  }

  function toggleSidebar(): void {
    state.showSidebar = !state.showSidebar;
  }

  function toggleMainSidebar(): void {
    state.showMainSidebar = !state.showMainSidebar;
  }

  function setMainSidebar(open: boolean): void {
    state.showMainSidebar = open;
  }

  function setSidebar(open: boolean): void {
    state.showSidebar = open;
  }

  function setSidebarWidth(width: number): void {
    state.sidebarWidth = width;
  }

  function setCurrentTheme(payload: string): void {
    state.currentTheme = payload;
  }

  function setGlobalTheme(payload: ThemeState): void {
    state.globalTheme = { ...state.globalTheme, ...payload };
  }

  function setToast(payload: ToastState): void {
    state.toast = { ...state.toast, ...payload };
  }

  function showSuccessToast(payload: { message: string }): void {
    state.toast = { variant: "success", open: true, ...payload };
  }

  function showDangerToast(payload: { message: string }): void {
    state.toast = { variant: "danger", open: true, ...payload };
  }

  function setWindowState(payload: "minimize" | "visible" | "foreground"): void {
    state.windowState = payload;
  }

  function setUpdateState({ updateState }: { updateState: UpdateState }): void {
    state.updateState = updateState;
  }

  function setGlobalLoading(payload: boolean): void {
    state.showGlobalLoading = payload;
  }

  function setGlobalError(payload: { show: boolean; message: string }): void {
    state.globalError = payload;
  }

  function setShowCreateCommunity(payload: boolean): void {
    state.modals.showCreateCommunity = payload;
  }

  function setShowEditCommunity(payload: boolean): void {
    state.modals.showEditCommunity = payload;
  }

  function setShowCommunityMembers(payload: boolean): void {
    state.modals.showCommunityMembers = payload;
  }

  function setShowCreateChannel(payload: boolean): void {
    state.modals.showCreateChannel = payload;
  }

  function setShowEditProfile(payload: boolean): void {
    state.modals.showEditProfile = payload;
  }

  function setShowDisclaimer(payload: boolean): void {
    state.modals.showDisclaimer = payload;
  }

  function setShowSettings(payload: boolean): void {
    state.modals.showSettings = payload;
  }

  function setShowCommunitySettings(payload: boolean): void {
    state.modals.showCommunitySettings = payload;
  }

  function setShowCommunityTweaks(payload: boolean): void {
    state.modals.showCommunityTweaks = payload;
  }

  function setActiveChannelId(id: string): void {
    state.activeChannelId = id;
  }

  function setShowEditChannel(show: boolean): void {
    state.modals.showEditChannel = show;
  }

  function setActiveCommunityId(uuid: string): void {
    state.activeCommunityId = uuid;
  }

  function setShowLeaveCommunity(show: boolean): void {
    state.modals.showLeaveCommunity = show;
  }

  function setShowInviteCode(payload: boolean): void {
    state.modals.showInviteCode = payload;
  }

  function setGlobalNotification(payload: boolean): void {
    state.notification.globalNotification = payload;
  }

  function setActiveWebrtc(instance: any, channelId: string): void {
    state.activeWebrtc.instance = instance;
    state.activeWebrtc.channelId = channelId;
  }

  // Actions
  async function changeCurrentTheme(payload: string): Promise<void> {
    if (payload === "global") {
      setTheme(state.globalTheme);
      setCurrentTheme("global");
    } else {
      // Todo: Get local theme
      // const theme = dataStore.getLocalCommunityState(payload).theme;
      // setTheme(theme!);
      // setCurrentTheme(payload);
    }
  }

  async function changeNotificationState(payload: boolean): Promise<void> {
    if (payload) {
      const notificationState = await Notification.requestPermission();
      if (notificationState === "granted") new Notification("Flux", { body: "Notifications Enabled!", icon: iconPath });
      if (notificationState === "denied") {
        showDangerToast({ message: "Notification is disabled from the browser please enable from there first" });
        setGlobalNotification(false);
      }
    }

    setGlobalNotification(payload);
  }

  async function joinTestingCommunity() {
    try {
      await joinCommunity({ joiningLink: DEFAULT_TESTING_NEIGHBOURHOOD });
    } catch (e) {
      showDangerToast({ message: e.message });
      throw new Error(e);
    }
  }

  async function updateCommunityTheme(payload: { communityId: string; theme: ThemeState }): Promise<void> {
    const { communityId, theme } = payload;
    // Todo: Merge community theme
    const mergedTheme = { ...theme };
    if (state.currentTheme === communityId) setTheme(mergedTheme);
    // Todo: Update community theme
  }

  async function updateGlobalTheme(payload: ThemeState): Promise<void> {
    const mergedTheme = { ...state.globalTheme, ...payload };
    if (state.currentTheme === "global") setTheme(mergedTheme);
    setGlobalTheme(mergedTheme);
  }

  return {
    // State
    ...toRefs(state),
    ad4mClient,

    // Mutations
    setAdamClient,
    setMe,
    toggleSidebar,
    toggleMainSidebar,
    setMainSidebar,
    setSidebar,
    setSidebarWidth,
    setCurrentTheme,
    setGlobalTheme,
    setToast,
    showSuccessToast,
    showDangerToast,
    setWindowState,
    setUpdateState,
    setGlobalLoading,
    setGlobalError,
    setShowCreateCommunity,
    setShowEditCommunity,
    setShowCommunityMembers,
    setShowCreateChannel,
    setShowEditProfile,
    setShowDisclaimer,
    setShowSettings,
    setShowCommunitySettings,
    setShowCommunityTweaks,
    setActiveChannelId,
    setShowEditChannel,
    setActiveCommunityId,
    setShowLeaveCommunity,
    setShowInviteCode,
    setGlobalNotification,
    setActiveWebrtc,

    // Actions
    changeCurrentTheme,
    changeNotificationState,
    joinTestingCommunity,
    updateCommunityTheme,
    updateGlobalTheme,
  };
});
