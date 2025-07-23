import { useAppStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { LinkQuery, NeighbourhoodProxy, PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { App, Channel, Community, Conversation, getAllFluxApps, Topic } from "@coasys/flux-api";
import { AgentData, Profile, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, inject, InjectionKey, ref, Ref, shallowRef, toRaw, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSignallingService } from "./useSignallingService";

export interface ChannelData {
  channel: Partial<Channel>;
  conversation?: Partial<Conversation>;
  children?: ChannelData[];
  notifications?: any;
  hasNewMessages?: boolean;
}

export interface ChannelDataWithAgents extends ChannelData {
  agentsInChannel: AgentData[];
  agentsInCall: AgentData[];
}

export interface CommunityService {
  perspective: PerspectiveProxy;
  neighbourhood: NeighbourhoodProxy;
  signallingService: SignallingService;
  isSynced: Ref<boolean>;
  isAuthor: ComputedRef<boolean>;
  community: ComputedRef<Community>;
  members: Ref<Partial<Profile>[]>;
  membersLoading: Ref<boolean>;
  allChannels: Ref<Channel[]>;
  pinnedConversations: Ref<ChannelData[]>;
  pinnedConversationsLoading: Ref<boolean>;
  pinnedConversationsWithAgents: ComputedRef<ChannelDataWithAgents[]>;
  recentConversations: Ref<ChannelData[]>;
  recentConversationsLoading: Ref<boolean>;
  recentConversationsWithAgents: ComputedRef<ChannelDataWithAgents[]>;
  channelsWithConversations: Ref<ChannelData[]>;
  channelsWithConversationsLoading: Ref<boolean>;
  channelsWithConversationsAndAgents: ComputedRef<ChannelDataWithAgents[]>;
  newConversationLoading: Ref<boolean>;
  moveConversationLoading: Ref<boolean>;
  getMembers: () => Promise<void>;
  getChannelsWithConversations: () => Promise<void>;
  getPinnedConversations: () => Promise<void>;
  getRecentConversations: () => Promise<void>;
  startNewConversation: (parentChannelId?: string) => Promise<void>;
  moveConversation: (conversationChannelId: string, targetChannelId: string) => Promise<void>;
}

export async function createCommunityService(): Promise<CommunityService> {
  const route = useRoute();
  const router = useRouter();
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

  const pinnedChannels = shallowRef<Channel[]>([]);
  const conversationChannels = shallowRef<Channel[]>([]);
  const spaceChannels = shallowRef<Channel[]>([]);
  const isSynced = ref(true);
  const members = ref<Partial<Profile>[]>([]);
  const membersLoading = ref(true);
  const pinnedConversations = ref<ChannelData[]>([]);
  const pinnedConversationsLoading = ref(true);
  const recentConversations = ref<ChannelData[]>([]);
  const recentConversationsLoading = ref(true);
  const channelsWithConversations = ref<ChannelData[]>([]);
  const channelsWithConversationsLoading = ref(true);
  const newConversationLoading = ref(false);
  const moveConversationLoading = ref(false);

  const isAuthor = computed(() => communities.value[0]?.author === me.value.did);
  const community = computed<Community>(() => communities.value[0]);
  const pinnedConversationsWithAgents = computed((): ChannelDataWithAgents[] => {
    return pinnedConversations.value.map((data) => ({
      ...data,
      agentsInChannel: signallingService.getAgentsInChannel(data.channel.baseExpression).value,
      agentsInCall: signallingService.getAgentsInCall(data.channel.baseExpression).value,
    }));
  });
  const recentConversationsWithAgents = computed((): ChannelDataWithAgents[] => {
    return recentConversations.value.map((data) => ({
      ...data,
      agentsInChannel: signallingService.getAgentsInChannel(data.channel.baseExpression).value,
      agentsInCall: signallingService.getAgentsInCall(data.channel.baseExpression).value,
    }));
  });
  const channelsWithConversationsAndAgents = computed((): ChannelDataWithAgents[] => {
    return channelsWithConversations.value.map((data) => ({
      ...data,
      agentsInChannel: signallingService.getAgentsInChannel(data.channel.baseExpression).value,
      agentsInCall: signallingService.getAgentsInCall(data.channel.baseExpression).value,
      children:
        data.children?.map((child) => ({
          ...child,
          agentsInChannel: signallingService.getAgentsInChannel(child.channel.baseExpression).value,
          agentsInCall: signallingService.getAgentsInCall(child.channel.baseExpression).value,
        })) || [],
    }));
  });

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

  async function getPinnedConversations() {
    pinnedConversationsLoading.value = true;

    // Loop through all the pinned channels and get the conversation data for each
    pinnedConversations.value = await Promise.all(
      pinnedChannels.value.map(async (channel: Channel) => {
        const conversation = (await Conversation.findAll(perspective, { source: channel.baseExpression }))[0];
        return { conversation, channel };
      })
    );

    pinnedConversationsLoading.value = false;
  }

  // TODO: make use of shared get children (or stats) function here, for expanding out conversations?
  async function getRecentConversations() {
    recentConversationsLoading.value = true;

    // Get the conversation data for each of the conversation channels and determine the last activity timestamp for each
    const conversations = await Promise.all(
      conversationChannels.value.map(async (channel: Channel) => {
        const conversation = (await Conversation.findAll(perspective, { source: channel.baseExpression }))[0];
        let lastActivity: string | null = null;

        if (!conversation) return null;

        // If there are unprocessed items, use the latest unprocessed items timestamp
        const channelRaw = toRaw(channel);
        const unprocessedItems = await channelRaw.unprocessedItems();
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

        return { conversation, channel, lastActivity };
      })
    );

    // Sort conversations by last activity timestamp
    const conversationsSortedByLastActivity = conversations
      .filter((c) => c !== null)
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

    recentConversations.value = conversationsSortedByLastActivity;
    recentConversationsLoading.value = false;
  }

  async function getChannelsWithConversations() {
    channelsWithConversationsLoading.value = true;

    // Loop through all the space channels and get the conversations in each
    channelsWithConversations.value = await Promise.all(
      spaceChannels.value.map(async (channel: Channel) => {
        // Get all nested conversation channels
        const nestedConversationChannels = await Channel.findAll(perspective, {
          source: channel.baseExpression,
          where: { isConversation: true },
        });

        // Get the conversation data for each of the nested conversation channels
        const conversations = await Promise.all(
          nestedConversationChannels.map(async (childChannel: Channel) => {
            const conversation = (await Conversation.findAll(perspective, { source: childChannel.baseExpression }))[0];
            // TODO: also get stats here?
            // TODO: investigate and remove explicit baseExpression from channel if possible
            // return { channel: childChannel, conversation };
            return { channel: { ...childChannel, baseExpression: childChannel.baseExpression }, conversation };
          })
        );

        return { channel, children: conversations };
      })
    );

    channelsWithConversationsLoading.value = false;
  }

  async function startNewConversation(parentChannelId?: string) {
    newConversationLoading.value = true;

    // Create the channel
    const channel = new Channel(perspective, undefined, parentChannelId);
    channel.name = "";
    channel.description = "";
    channel.isConversation = true;
    channel.isPinned = false;
    await channel.save();

    // Create the first placeholder conversation
    const conversation = new Conversation(perspective, undefined, channel.baseExpression);
    conversation.conversationName = "New conversation";
    conversation.summary = "Content will appear when the first items have been processed...";
    await conversation.save();

    // Attach the chat app
    const fluxApps = await getAllFluxApps();
    const chatAppData = fluxApps.find((app) => app.pkg === "@coasys/flux-chat-view");

    const { name, description, icon, pkg } = chatAppData!;

    const chatApp = new App(perspective, undefined, channel.baseExpression);
    chatApp.name = name;
    chatApp.description = description;
    chatApp.icon = icon;
    chatApp.pkg = pkg;
    await chatApp.save();

    // Navigate to the new channel
    const communityId = route.params.communityId as string;
    router.push({ name: "view", params: { communityId, channelId: channel.baseExpression, viewId: "conversation" } });

    newConversationLoading.value = false;
  }

  async function moveConversation(conversationChannelId: string, targetChannelId: string) {
    moveConversationLoading.value = true;

    try {
      console.log(`Moving conversation ${conversationChannelId} to channel ${targetChannelId}`);

      // Get the link from the conversation channel to its current parent
      const link = (
        await perspective.get(new LinkQuery({ predicate: "ad4m://has_child", target: conversationChannelId }))
      )[0];

      // Skip if the conversation is already linked to the target channel
      if (link.source === targetChannelId) return;

      // Update the link to point to the new parent channel
      await perspective.update(link, {
        source: targetChannelId,
        predicate: "ad4m://has_child",
        target: conversationChannelId,
      });

      // Refresh the channels list
      getChannelsWithConversations();

      console.log("Conversation moved successfully");
    } catch (error) {
      console.error("Failed to move conversation:", error);
      throw error;
    } finally {
      moveConversationLoading.value = false;
    }
  }

  // Initialize sync state listener
  perspective.addSyncStateChangeListener((state: PerspectiveState) => {
    // @ts-ignore
    isSynced.value = state === PerspectiveState.Synced || state === '"Synced"'; // Todo: state should be "SYNCED" not ""Synced""
    return null;
  });

  getMembers();

  watch(allChannels, (newChannels) => {
    pinnedChannels.value = newChannels.filter((channel) => channel.isPinned);
    conversationChannels.value = newChannels.filter((channel) => channel.isConversation);
    spaceChannels.value = newChannels.filter((channel) => !channel.isConversation);
  });
  watch(pinnedChannels, getPinnedConversations);
  watch(conversationChannels, getRecentConversations);
  watch(spaceChannels, getChannelsWithConversations);

  return {
    perspective,
    neighbourhood,
    signallingService,
    isSynced,
    isAuthor,
    community,
    members,
    membersLoading,
    allChannels,
    pinnedConversations,
    pinnedConversationsLoading,
    pinnedConversationsWithAgents,
    recentConversations,
    recentConversationsLoading,
    recentConversationsWithAgents,
    channelsWithConversations,
    channelsWithConversationsLoading,
    channelsWithConversationsAndAgents,
    newConversationLoading,
    moveConversationLoading,
    getMembers,
    getChannelsWithConversations,
    getPinnedConversations,
    getRecentConversations,
    startNewConversation,
    moveConversation,
  };
}

export const CommunityServiceKey: InjectionKey<Awaited<CommunityService>> = Symbol("FluxCommunityService");

export function useCommunityService() {
  const service = inject(CommunityServiceKey);
  if (!service)
    throw new Error("Unable to inject service. Make sure your component is a child of the CommunityView component.");
  return service;
}
