import iconPath from "@/assets/images/icon.png";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { ToastState, UpdateState } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Ad4mClient, Agent, PerspectiveProxy } from "@coasys/ad4m";
import { Community, joinCommunity } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { defineStore } from "pinia";
import { computed, ref, shallowRef, toRaw } from "vue";

export const useAppStore = defineStore(
  "appStore",
  () => {
    const me = ref<Agent>({ did: "" });
    const myProfile = ref<Profile | null>(null);
    const updateState = ref<UpdateState>("not-available");
    const toast = ref<ToastState>({ variant: undefined, message: "", open: false });
    const notification = ref<{ globalNotification: boolean }>({ globalNotification: true });
    const myPerspectives = ref<PerspectiveProxy[]>([]);
    const myCommunities = ref<Record<string, Community>>({}); // Todo: store this as an array instead?

    // Store a shallow ref of the Ad4mClient so we retain access to its methods
    const ad4mClientRef = shallowRef<Ad4mClient | null>(null);

    // Wrap the Ad4mClient in a computed property to prevent access before initialization and avoid null checks
    const ad4mClient = computed(() => {
      if (!ad4mClientRef.value) console.error("Trying to access Ad4mClient before initialization");
      return ad4mClientRef.value as Ad4mClient;
    });

    const hasJoinedTestingCommunity = computed(() => {
      return !!myPerspectives.value.find((p) => p.sharedUrl === DEFAULT_TESTING_NEIGHBOURHOOD);
    });

    // Mutations
    function setAdamClient(client: Ad4mClient): void {
      ad4mClientRef.value = client;
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

    // Actions
    async function changeNotificationState(payload: boolean): Promise<void> {
      if (payload) {
        const notificationState = await Notification.requestPermission();
        if (notificationState === "granted")
          new Notification("Flux", { body: "Notifications Enabled!", icon: iconPath });
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
      // Get all my perspectives
      myPerspectives.value = await ad4mClient.value.perspective.all();

      // Filter perspectives that have a neighbourhood and map to community entries
      const communityEntries = await Promise.all(
        toRaw(myPerspectives.value)
          .filter((perspective) => perspective.neighbourhood)
          .map(async (perspective) => {
            const community = (await Community.findAll(perspective as PerspectiveProxy))[0];
            return community ? ([perspective.uuid, community] as const) : null;
          })
      );

      // Filter out null results and create object from entries
      const newCommunities = Object.fromEntries(communityEntries.filter(Boolean) as Array<[string, Community]>);

      myCommunities.value = { ...myCommunities.value, ...newCommunities };
    }

    async function refreshMyProfile() {
      me.value = await ad4mClient.value.agent.me();
      myProfile.value = await getCachedAgentProfile(me.value.did, true);
    }

    return {
      // State
      ad4mClient,
      me,
      myProfile,
      updateState,
      toast,
      notification,
      myPerspectives,
      myCommunities,
      hasJoinedTestingCommunity,

      // Mutations
      setAdamClient,
      setToast,
      showSuccessToast,
      showDangerToast,
      setUpdateState,
      setGlobalNotification,

      // Actions
      changeNotificationState,
      joinTestingCommunity,
      getMyCommunities,
      refreshMyProfile,
    };
  },
  { persist: { omit: ["myPerspectives", "myCommunities"] } }
);
