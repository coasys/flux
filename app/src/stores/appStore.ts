import iconPath from "@/assets/images/icon.png";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { ToastState, UpdateState } from "@/stores/types";
import { Ad4mClient, Agent } from "@coasys/ad4m";
import { Community, joinCommunity } from "@coasys/flux-api";
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";

export const useAppStore = defineStore("appStore", () => {
  const me = ref<Agent>({ did: "" });
  const updateState = ref<UpdateState>("not-available");
  const toast = ref<ToastState>({ variant: undefined, message: "", open: false });
  const notification = ref<{ globalNotification: boolean }>({ globalNotification: false });
  const aiEnabled = ref(false);
  const myCommunities = ref<Record<string, Community>>({});

  // Store a shallow ref of the Ad4mClient so we retain access to its methods
  const ad4mClientRef = shallowRef<Ad4mClient | null>(null);

  // Wrap the Ad4mClient in a computed property to prevent access before initialization and avoid null checks
  const ad4mClient = computed(() => {
    if (!ad4mClientRef.value) console.error("Trying to access Ad4mClient before initialization");
    return ad4mClientRef.value as Ad4mClient;
  });

  // Mutations
  function setAdamClient(client: Ad4mClient): void {
    ad4mClientRef.value = client;
  }

  function setMe(newMe: Agent): void {
    me.value = newMe;
  }

  // Todo: move toasts & notifications to ui store?
  function setToast(payload: ToastState): void {
    toast.value = { ...toast.value, ...payload };
  }

  function showSuccessToast(payload: { message: string }): void {
    toast.value = { variant: "success", open: true, ...payload };
  }

  function showDangerToast(payload: { message: string }): void {
    toast.value = { variant: "danger", open: true, ...payload };
  }

  function setUpdateState({ updateState: newUpdateState }: { updateState: UpdateState }): void {
    updateState.value = newUpdateState;
  }

  function setGlobalNotification(payload: boolean): void {
    notification.value.globalNotification = payload;
  }

  function setAIEnabled(payload: boolean): void {
    aiEnabled.value = payload;
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
          if (community) myCommunities.value[p.uuid] = community;
        })
    );
  }

  return {
    // State
    ad4mClient,
    me,
    updateState,
    toast,
    notification,
    aiEnabled,
    myCommunities,

    // Mutations
    setAdamClient,
    setMe,
    setToast,
    showSuccessToast,
    showDangerToast,
    setUpdateState,
    setGlobalNotification,
    setAIEnabled,

    // Actions
    changeNotificationState,
    joinTestingCommunity,
    getMyCommunities,
  };
});
