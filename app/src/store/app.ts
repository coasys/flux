import iconPath from "@/assets/images/icon.png";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { AppStore, ToastState, UpdateState } from "@/store/types";
import { Ad4mClient, Agent } from "@coasys/ad4m";
import { Community, joinCommunity } from "@coasys/flux-api";
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

  const state = reactive<AppStore>({
    me: { did: "" },
    myCommunities: {},
    updateState: "not-available",
    toast: { variant: undefined, message: "", open: false },
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

  function setToast(payload: ToastState): void {
    state.toast = { ...state.toast, ...payload };
  }

  function showSuccessToast(payload: { message: string }): void {
    state.toast = { variant: "success", open: true, ...payload };
  }

  function showDangerToast(payload: { message: string }): void {
    state.toast = { variant: "danger", open: true, ...payload };
  }

  function setUpdateState({ updateState }: { updateState: UpdateState }): void {
    state.updateState = updateState;
  }

  function setGlobalNotification(payload: boolean): void {
    state.notification.globalNotification = payload;
  }

  function setActiveWebrtc(instance: any, channelId: string): void {
    state.activeWebrtc.instance = instance;
    state.activeWebrtc.channelId = channelId;
  }

  // Actions
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

  async function getMyCommunities() {
    const allMyPerspectives = await ad4mClient.value.perspective.all();
    await Promise.all(
      allMyPerspectives
        .filter((p) => p.neighbourhood)
        .map(async (p) => {
          const community = (await Community.findAll(p))[0];
          if (community && !state.myCommunities[p.uuid]) state.myCommunities[p.uuid] = community;
        })
    );
  }

  return {
    // State
    ...toRefs(state),
    ad4mClient,

    // Mutations
    setAdamClient,
    setMe,
    setToast,
    showSuccessToast,
    showDangerToast,
    setUpdateState,
    setGlobalNotification,
    setActiveWebrtc,

    // Actions
    changeNotificationState,
    joinTestingCommunity,
    getMyCommunities,
  };
});
