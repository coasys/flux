import iconPath from '@/assets/images/icon.png';
import { DEFAULT_TESTING_NEIGHBOURHOOD } from '@/constants';
import { ToastState, UpdateState } from '@/stores';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { Ad4mClient, Agent, PerspectiveProxy } from '@coasys/ad4m';
import { Community, joinCommunity } from '@coasys/flux-api';
import { Profile } from '@coasys/flux-types';
import { defineStore } from 'pinia';
import { computed, ref, shallowRef, toRaw } from 'vue';

export const useAppStore = defineStore(
  'appStore',
  () => {
    const initialized = ref<boolean>(false);
    const me = ref<Agent>({ did: '' });
    const myProfile = ref<Profile | null>(null);
    const updateState = ref<UpdateState>('not-available');
    const toast = ref<ToastState>({ variant: undefined, message: '', open: false });
    const notification = ref<{ globalNotification: boolean }>({ globalNotification: true });
    const myPerspectives = shallowRef<PerspectiveProxy[]>([]);
    const myCommunities = ref<Record<string, Community>>({}); // Todo: store this as an array instead?
    const communitiesLoaded = ref<boolean>(false);
    const holochainRestarting = ref<boolean>(false);

    // Store a shallow ref of the Ad4mClient so we retain access to its methods
    const ad4mClientRef = shallowRef<Ad4mClient | null>(null);

    // Wrap the Ad4mClient in a computed property to prevent access before initialization and avoid null checks
    const ad4mClient = computed(() => {
      if (!ad4mClientRef.value) console.error('Trying to access Ad4mClient before initialization');
      return ad4mClientRef.value as Ad4mClient;
    });

    const clientReady = computed(() => ad4mClientRef.value !== null);

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
      toast.value = { variant: 'success', open: true, ...payload };
    }

    function showDangerToast(payload: { message: string }): void {
      toast.value = { variant: 'danger', open: true, ...payload };
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
        if (notificationState === 'granted')
          new Notification('Flux', { body: 'Notifications Enabled!', icon: iconPath });
        if (notificationState === 'denied') {
          showDangerToast({ message: 'Notification is disabled from the browser please enable from there first' });
          setGlobalNotification(false);
        }
      }

      setGlobalNotification(payload);
    }

    async function joinTestingCommunity() {
      try {
        await joinCommunity({ joiningLink: DEFAULT_TESTING_NEIGHBOURHOOD, client: ad4mClient.value });
      } catch (e) {
        showDangerToast({ message: e.message });
        throw new Error(e);
      }
    }

    async function getMyCommunities() {
      try {
        // Get all my perspectives
        myPerspectives.value = await ad4mClient.value.perspective.all();

        // Filter perspectives that have a neighbourhood (or a community entry_type) and map to community entries
        const communityEntries = await Promise.all(
          toRaw(myPerspectives.value)
            .map(async (perspective) => {
              try {
                // Ensure SDNA is installed before querying (needed for imported perspectives)
                await (perspective as PerspectiveProxy).ensureSDNASubjectClass(Community);
                const allCommunities = await Community.findAll(perspective as PerspectiveProxy);
                const community = allCommunities[0];
                if (!community) return null;
                const key = perspective.sharedUrl || `private://${perspective.uuid}`;
                return [key, community] as const;
              } catch (e) {
                console.warn(`Failed to load community from perspective ${perspective.uuid}:`, e);
                return null;
              }
            }),
        );

        // Filter out null results and create object from entries
        const newCommunities = Object.fromEntries(communityEntries.filter(Boolean) as Array<[string, Community]>);
        myCommunities.value = { ...myCommunities.value, ...newCommunities };
        communitiesLoaded.value = true;
      } catch (e) {
        showDangerToast({ message: 'Failed to load communities' });
        throw e;
      }
    }

    async function refreshMyProfile() {
      // First fetch the agent info
      me.value = await ad4mClient.value.agent.me();
      myProfile.value = await getCachedAgentProfile(me.value.did, ad4mClient.value, true);
    }

    async function restartHolochain() {
      try {
        holochainRestarting.value = true;
        await ad4mClient.value.runtime.restartHolochain();
        showSuccessToast({ message: 'Holochain restarted successfully' });
      } catch (e) {
        showDangerToast({ message: e.message });
        throw e;
      } finally {
        holochainRestarting.value = false;
      }
    }

    function getPerspective(neighbourhoodUrl: string): PerspectiveProxy | undefined {
      // Support both neighbourhood:// URLs and private:// UUID lookups
      let perspective = myPerspectives.value.find((p) => p.sharedUrl === neighbourhoodUrl) as
        | PerspectiveProxy
        | undefined;
      if (!perspective && neighbourhoodUrl.startsWith('private://')) {
        const uuid = neighbourhoodUrl.slice('private://'.length);
        perspective = myPerspectives.value.find((p) => p.uuid === uuid) as PerspectiveProxy | undefined;
      }
      return toRaw(perspective);
    }

    return {
      // State
      initialized,
      ad4mClient,
      me,
      myProfile,
      updateState,
      toast,
      notification,
      communitiesLoaded,
      myPerspectives,
      myCommunities,
      hasJoinedTestingCommunity,
      holochainRestarting,
      clientReady,

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
      restartHolochain,
      getPerspective,
    };
  },
  { persist: { omit: ['initialized', 'myPerspectives', 'myCommunities'] } },
);
