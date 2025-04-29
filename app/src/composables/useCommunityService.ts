import { ref, readonly, inject, InjectionKey, computed } from 'vue'
import { Profile } from "@coasys/flux-types";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Ad4mClient, PerspectiveProxy } from '@coasys/ad4m';
import { Channel, Community } from "@coasys/flux-api";
import { getCachedAgentProfile } from "@/utils/userProfileCache"

export async function createCommunityService(client: Ad4mClient, uuid: string) {
    const perspective = await client.perspective.byUUID(uuid) as PerspectiveProxy;
    const neighbourhood = perspective.getNeighbourhoodProxy();

    // General state
    const loading = ref(true);
    const members = ref<Profile[]>([]);

    // Model subscriptions
    const { entries: communities } = useModel({ perspective, model: Community });
    const { entries: channels } = useModel({ perspective, model: Channel });

    // Getter functions
    async function getMembers() {
        try {
            const others = await neighbourhood?.otherAgents() || [];
            const me = await client.agent.me();
            const allMembersDids = [...others, me.did];
            members.value = await Promise.all(allMembersDids.map((did) => getCachedAgentProfile(did)));
        } catch (error) {
            console.error("Error loading community members:", error);
        }
    }

    async function getInitialData() {
        await getMembers()
        loading.value = false;
    }

    getInitialData()

    return {
        perspective: readonly(perspective),
        neighbourhood: readonly(neighbourhood),
        loading: readonly(loading),
        members: readonly(members),
        community: readonly(computed(() => communities.value[0] || null)),
        channels: readonly(channels),
        getMembers,
    }
}

export const CommunityServiceKey: InjectionKey<Awaited<ReturnType<typeof createCommunityService>>> = Symbol('CommunityService')

export function useCommunityService() {
  const service = inject(CommunityServiceKey)
  if (!service) throw new Error('Community service not provided. Make sure your component is a child of the CommunityView component.')
  return service
}