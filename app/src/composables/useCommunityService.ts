import { useAppStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { NeighbourhoodProxy, PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Channel, Community, Conversation, Topic } from "@coasys/flux-api";
import { Profile, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, inject, InjectionKey, ref, Ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { useSignallingService } from "./useSignallingService";

export interface ChannelWithChildren extends Channel {
  children?: ChannelWithChildren[];
  notifications?: any;
  hasNewMessages?: boolean;
}

export interface CommunityService {
  perspective: PerspectiveProxy;
  neighbourhood: NeighbourhoodProxy;
  isSynced: Ref<boolean>;
  isAuthor: ComputedRef<boolean>;
  community: ComputedRef<Community>;
  members: Ref<Partial<Profile>[]>;
  membersLoading: Ref<boolean>;
  allChannels: Ref<Channel[]>;
  nestedChannels: Ref<ChannelWithChildren[]>;
  channelsLoading: Ref<boolean>;
  pinnedConversations: Ref<any[]>;
  pinnedConversationsLoading: Ref<boolean>;
  recentConversations: Ref<any[]>;
  recentConversationsLoading: Ref<boolean>;
  signallingService: SignallingService;
  getMembers: () => Promise<void>;
  getNestedChannels: () => Promise<void>;
  getPinnedConversations: () => Promise<void>;
  getRecentConversations: () => Promise<void>;
}

export async function createCommunityService(): Promise<CommunityService> {
  const route = useRoute();
  const appStore = useAppStore();
  const { me } = storeToRefs(appStore);

  // Get the perspective and neighbourhood proxies
  const perspective = (await appStore.ad4mClient.perspective.byUUID(
    route.params.communityId as string
  )) as PerspectiveProxy;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Ensure required SDNA is installed (Todo: include other models here...)
  perspective.ensureSDNASubjectClass(Topic);

  // Initialise the signalling service for the community
  const signallingService = useSignallingService(perspective.uuid, neighbourhood);

  // Model subscriptions (Todo: singularise communities when singular useModel hook available)
  const { entries: communities } = useModel({ perspective, model: Community });
  const { entries: allChannels } = useModel({ perspective, model: Channel });

  const members = ref<Partial<Profile>[]>([]);
  const membersLoading = ref(true);
  const isSynced = ref(true);
  const nestedChannels = shallowRef<ChannelWithChildren[]>([]);
  const channelsLoading = ref(true);
  const pinnedConversations = ref<any[]>([]);
  const pinnedConversationsLoading = ref(true);
  const recentConversations = ref<any[]>([]);
  const recentConversationsLoading = ref(true);

  const isAuthor = computed(() => communities.value[0]?.author === me.value.did);
  const community = computed<Community>(() => communities.value[0]);

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

  async function recursivelyGetSubChannels(channel: ChannelWithChildren): Promise<ChannelWithChildren> {
    // Get the sub-channels for the current channel
    const subChannels = await Channel.findAll(perspective, {
      source: channel.baseExpression,
      where: { isConversation: false },
    });
    channel.children = subChannels;

    // Rerun the function recursively for each sub-channel
    await Promise.all(subChannels.map(recursivelyGetSubChannels));

    return channel;
  }

  async function getNestedChannels() {
    channelsLoading.value = true;

    // Find all root channels that are not conversations
    const newRootChannels = await Channel.findAll(perspective, {
      source: "ad4m://self",
      where: { isConversation: false },
    });

    // Recursively get sub-channels for each root channel
    await Promise.all(newRootChannels.map(async (channel: ChannelWithChildren) => recursivelyGetSubChannels(channel)));

    nestedChannels.value = newRootChannels;
    channelsLoading.value = false;
  }

  async function getPinnedConversations() {
    pinnedConversationsLoading.value = true;

    // Find all channels that are pinned
    const pinnedChannels = await Channel.findAll(perspective, { where: { isPinned: true } });

    // Get the conversation data for each pinned channel
    pinnedConversations.value = await Promise.all(
      pinnedChannels.map(async (channel: Channel) => {
        const conversation = (await Conversation.findAll(perspective, { source: channel.baseExpression }))[0];
        return { ...conversation, channelId: channel.baseExpression };
      })
    );

    pinnedConversationsLoading.value = false;
  }

  async function getRecentConversations() {
    recentConversationsLoading.value = true;

    // Find all channels that are conversations
    const conversationChannels = await Channel.findAll(perspective, { where: { isConversation: true } });

    // Get the conversation data and determine the last activity timestamp for each channel
    const conversations = await Promise.all(
      conversationChannels.map(async (channel: Channel) => {
        const conversation = (await Conversation.findAll(perspective, { source: channel.baseExpression }))[0];
        let lastActivity: string | null = null;

        // If there are unprocessed items, use the latest unprocessed items timestamp
        const unprocessedItems = await channel.unprocessedItems();
        if (unprocessedItems.length) {
          const lastUnprocessedItem = unprocessedItems.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          lastActivity = lastUnprocessedItem.timestamp;
        } else if (conversation.summary === "Content will appear when the first items have been processed...") {
          // If the conversation is an empty placeholder use the conversations timestamp
          lastActivity = conversation.timestamp;
        } else {
          // If no subgroups exist, use the conversation timestamp
          const subgroups = await conversation.subgroups();
          if (!subgroups.length) lastActivity = conversation.timestamp;
          else {
            // If no items exist in the last subgroup, use the subgroup timestamp
            const lastSubgroup = subgroups[subgroups.length - 1];
            const items = await lastSubgroup.itemsData();
            if (!items.length) lastActivity = lastSubgroup.timestamp;
            else {
              // Finally, use the timestamp of the last item in the last subgroup
              const lastItem = items.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )[0];
              lastActivity = lastItem.timestamp;
            }
          }
        }

        return { ...conversation, channelId: channel.baseExpression, lastActivity };
      })
    );

    // Sort conversations by last activity timestamp
    const conversationsSortedByLastActivity = conversations.sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    recentConversations.value = conversationsSortedByLastActivity;
    recentConversationsLoading.value = false;
  }

  // Initialize sync state listener
  perspective.addSyncStateChangeListener((state: PerspectiveState) => {
    // @ts-ignore
    isSynced.value = state === PerspectiveState.Synced || state === '"Synced"'; // Todo: state should be "SYNCED" not ""Synced""
    return null;
  });

  getMembers();

  // TODO: review
  watch(allChannels, () => {
    getNestedChannels();
    getPinnedConversations();
    getRecentConversations();
  });

  return {
    perspective,
    neighbourhood,
    isSynced,
    isAuthor,
    community,
    members,
    membersLoading,
    allChannels,
    nestedChannels,
    channelsLoading,
    pinnedConversations,
    pinnedConversationsLoading,
    recentConversations,
    recentConversationsLoading,
    signallingService,
    getMembers,
    getNestedChannels,
    getPinnedConversations,
    getRecentConversations,
  };
}

export const CommunityServiceKey: InjectionKey<Awaited<CommunityService>> = Symbol("FluxCommunityService");

export function useCommunityService() {
  const service = inject(CommunityServiceKey);
  if (!service)
    throw new Error("Unable to inject service. Make sure your component is a child of the CommunityView component.");
  return service;
}
