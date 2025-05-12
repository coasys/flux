import { useAppStore } from "@/store/app";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Channel, Community, Topic } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, inject, InjectionKey, ref } from "vue";
import { useRoute } from "vue-router";
import { useSignallingService } from "./useSignallingService";

export async function createCommunityService() {
  const route = useRoute();
  const app = useAppStore();
  const { me } = storeToRefs(app);

  // Get the perspective and neighbourhood proxies
  const perspective = (await app.ad4mClient.perspective.byUUID(route.params.communityId as string)) as PerspectiveProxy;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Ensure required SDNA is installed (Todo: include other models here...)
  perspective.ensureSDNASubjectClass(Topic);

  // Model subscriptions (Todo: singularise communities when singular useModel hook available)
  const { entries: communities } = useModel({ perspective, model: Community });
  const { entries: channels, loading: channelsLoading } = useModel({ perspective, model: Channel });

  // Reactive state
  const members = ref<Partial<Profile>[]>([]);
  const membersLoading = ref(true);
  const perspectiveState = ref(perspective.state);
  const isSynced = computed(() => perspectiveState.value === PerspectiveState.Synced);
  const isAuthor = computed(() => communities.value[0]?.author === me.value.did);
  const community = computed(() => communities.value[0] || null);

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

  // Initialise the signalling service
  const signallingService = useSignallingService(perspective.uuid, neighbourhood);
  signallingService.startSignalling();

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

export const CommunityServiceKey: InjectionKey<Awaited<ReturnType<typeof createCommunityService>>> =
  Symbol("FluxCommunityService");

export function useCommunityService() {
  const service = inject(CommunityServiceKey);
  if (!service)
    throw new Error("Unable to inject service. Make sure your component is a child of the CommunityView component.");
  return service;
}
