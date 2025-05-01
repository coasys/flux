import { useAppStore } from "@/store/app";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Channel, Community, Topic } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { computed, inject, InjectionKey, readonly, ref } from "vue";
import { useRoute } from "vue-router";
import { useSignalingService } from "./useSignallingService";

export async function createCommunityService() {
  const { ad4mClient, me } = useAppStore();

  // Get the communities UUID and the active channel ID from the route
  const route = useRoute();
  const { communityId: uuid, channelId } = route.params;
  const communityId = Array.isArray(uuid) ? uuid[0] : uuid;
  const activeChannelId = Array.isArray(channelId) ? channelId[0] : channelId;

  // Get the perspective and neighbourhood proxies using the UUID
  const perspective = (await ad4mClient.perspective.byUUID(communityId)) as PerspectiveProxy;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Ensure required SDNA is installed (Todo: include other models here...)
  perspective.ensureSDNASubjectClass(Topic);

  // Model subscriptions (Todo: singularise communities when singular useModel hook available)
  const { entries: communities, loading: communityLoading } = useModel({ perspective, model: Community });
  const { entries: channels, loading: channelsLoading } = useModel({ perspective, model: Channel });

  // General state
  const isSynced = computed(() => perspective.state === PerspectiveState.Synced);
  const isAuthor = computed(() => communities.value[0]?.author === me.did);
  const community = computed(() => communities.value[0] || null);
  const members = ref<Profile[]>([]);
  const membersLoading = ref(true);

  // Getter functions
  async function getMembers() {
    try {
      membersLoading.value = true;
      const others = (await neighbourhood?.otherAgents()) || [];
      const allMembersDids = [...others, me.did];
      members.value = await Promise.all(allMembersDids.map((did) => getCachedAgentProfile(did)));
      membersLoading.value = false;
    } catch (error) {
      console.error("Error loading community members:", error);
      membersLoading.value = false;
    }
  }

  // Initialise the signalling service
  const signalingService = useSignalingService(neighbourhood);
  signalingService.startSignaling();

  getMembers();

  return {
    // Todo: Look into whether best to store the ids here or necissary to place in the main app store
    // Currently used in MainView for the modals (which should be moved into the community view... but also needed in signaling service)
    communityId,
    activeChannelId,

    perspective,
    neighbourhood,
    isSynced: readonly(isSynced),
    isAuthor: readonly(isAuthor),
    community: readonly(community),
    members: readonly(members),
    channels: readonly(channels),
    communityLoading: readonly(communityLoading),
    membersLoading: readonly(membersLoading),
    channelsLoading: readonly(channelsLoading),

    getMembers,
    signalingService,
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
