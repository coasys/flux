import { useAppStore } from "@/store/appStore";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { NeighbourhoodProxy, PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Channel, Community, Topic } from "@coasys/flux-api";
import { Profile, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, inject, InjectionKey, ref, Ref } from "vue";
import { useRoute } from "vue-router";
import { useSignallingService } from "./useSignallingService";

export interface CommunityService {
  perspective: PerspectiveProxy;
  neighbourhood: NeighbourhoodProxy;
  isSynced: ComputedRef<boolean>;
  isAuthor: ComputedRef<boolean>;
  community: ComputedRef<Community>;
  members: Ref<Partial<Profile>[]>;
  membersLoading: Ref<boolean>;
  channels: Ref<Channel[]>;
  channelsLoading: Ref<boolean>;
  signallingService: SignallingService;
  getMembers: () => Promise<void>;
}

export async function createCommunityService(): Promise<CommunityService> {
  const route = useRoute();
  const app = useAppStore();
  const { me } = storeToRefs(app);

  // Get the perspective and neighbourhood proxies
  const perspective = (await app.ad4mClient.perspective.byUUID(route.params.communityId as string)) as PerspectiveProxy;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Ensure required SDNA is installed (Todo: include other models here...)
  perspective.ensureSDNASubjectClass(Topic);

  // Initialise the signalling service for the community
  const signallingService = useSignallingService(perspective.uuid, neighbourhood);

  // Model subscriptions (Todo: singularise communities when singular useModel hook available)
  const { entries: communities } = useModel({ perspective, model: Community });
  const { entries: channels, loading: channelsLoading } = useModel({ perspective, model: Channel });

  // Reactive state
  const members = ref<Partial<Profile>[]>([]);
  const membersLoading = ref(true);
  const perspectiveState = ref(perspective.state);
  const isSynced = computed(() => perspectiveState.value === PerspectiveState.Synced);
  const isAuthor = computed(() => communities.value[0]?.author === me.value.did);
  const community = computed<Community>(() => communities.value[0]);

  // Getters
  async function getMembers() {
    try {
      membersLoading.value = true;
      const others = (await neighbourhood?.otherAgents()) || [];
      const allMembersDids = [...others, me.value.did];
      // Pre-fill members with partial profiles to speed up display
      members.value = allMembersDids.map((did) => ({ did, profileThumbnailPicture: undefined }));
      // Fetch full profiles with images
      members.value = await Promise.all(allMembersDids.map((did) => getCachedAgentProfile(did)));
      membersLoading.value = false;
    } catch (error) {
      console.error("Error loading community members:", error);
      membersLoading.value = false;
    }
  }

  // // // Initialize sync state listener
  // perspective.value.addSyncStateChangeListener((state: PerspectiveState) => {
  //   console.log("***** state from listener: ", state);
  //   // @ts-ignore
  //   // isSynced.value = state === PerspectiveState.Synced || state === '"Synced"'; // Todo: state should be "SYNCED" not ""Synced""
  //   return null;
  // });

  getMembers();

  return {
    perspective,
    neighbourhood,
    isSynced,
    isAuthor,
    community,
    members,
    membersLoading,
    channels,
    channelsLoading,
    signallingService,
    getMembers,
  };
}

export const CommunityServiceKey: InjectionKey<Awaited<CommunityService>> = Symbol("FluxCommunityService");

export function useCommunityService() {
  const service = inject(CommunityServiceKey);
  if (!service)
    throw new Error("Unable to inject service. Make sure your component is a child of the CommunityView component.");
  return service;
}
