import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Channel, Community } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { computed, inject, InjectionKey, readonly, ref } from "vue";
import { useRoute } from "vue-router";

export async function createCommunityService() {
  // Get the communities UUID and the active channel ID from the route
  const route = useRoute();
  const { communityId: uuid, channelId } = route.params;
  const communityId = Array.isArray(uuid) ? uuid[0] : uuid;
  const activeChannelId = Array.isArray(channelId) ? channelId[0] : channelId;

  // Todo: get client and me from global appStore
  const client = await getAd4mClient();
  const me = await client.agent.me();

  // Get the perspective and neighbourhood proxies using the UUID
  const perspective = (await client.perspective.byUUID(communityId)) as PerspectiveProxy;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Model subscriptions
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
      const others = (await neighbourhood?.otherAgents()) || [];
      const allMembersDids = [...others, me.did];
      members.value = await Promise.all(allMembersDids.map((did) => getCachedAgentProfile(did)));
      membersLoading.value = false;
    } catch (error) {
      console.error("Error loading community members:", error);
    }
  }

  getMembers();

  return {
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
