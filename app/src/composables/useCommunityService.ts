import { useAiStore, useAppStore, useUiStore } from '@/stores';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { restoreNeighbourhoodPrefix, stripChannelPrefix } from '@/utils/routeUtils';
import { Link, LinkQuery, NeighbourhoodProxy, PerspectiveProxy, PerspectiveState } from '@coasys/ad4m';
import { useLive } from '@coasys/ad4m-vue-hooks';
import {
  App,
  Channel,
  Community,
  Conversation,
  ConversationSubgroup,
  Embedding,
  getAllFluxApps,
  Message,
  SemanticRelationship,
  TaskBoard,
  TaskColumn,
  Topic,
  Task,
} from '@coasys/flux-api';
import { community as communityPredicates } from '@coasys/flux-constants';

const { CHANNEL, CHANNEL_CONVERSATION } = communityPredicates;
import { AgentData, Profile, SignallingService } from '@coasys/flux-types';
import { storeToRefs } from 'pinia';
import { computed, ComputedRef, inject, InjectionKey, ref, Ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { HEARTBEAT_INTERVAL, useSignallingService } from './useSignallingService';

// Stored in ref<> — only primitives, no model instances (avoids Vue UnwrapRef structural incompatibility)
export interface ChannelData {
  channelId: string;
  conversationId?: string;
  lastActivity?: string;
  children?: ChannelData[];
}

// Returned from computed — includes resolved model instances (ComputedRef does not apply deep unwrapping)
export interface ChannelDataWithAgents {
  channelId: string;
  channel?: Channel;
  conversationId?: string;
  conversation?: Conversation;
  lastActivity?: string;
  children?: ChannelDataWithAgents[];
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
  moveConversation: (
    conversationChannelId: string,
    newSpaceChannelId: string,
    conversationName?: string,
  ) => Promise<void>;
  getParentChannel: (channelId: string) => Channel | undefined;
  getConversation: (channelId: string) => Conversation | undefined;
  cleanup: () => void;
}

const DEFAULT_CHAT_APP_PKG = '@coasys/flux-chat-view';

export async function createCommunityService(): Promise<CommunityService> {
  const route = useRoute();
  const router = useRouter();
  const appStore = useAppStore();
  const aiStore = useAiStore();
  const uiStore = useUiStore();
  const { me } = storeToRefs(appStore);
  const { aiEnabled } = storeToRefs(aiStore);

  // Get the perspective and neighbourhood proxies
  const maybePerspective = appStore.getPerspective(restoreNeighbourhoodPrefix(route.params.communityId as string));
  if (!maybePerspective) {
    const communityId = route.params.communityId as string;
    console.error(`Failed to get perspective for community: ${communityId}`);
    throw new Error(
      `Perspective not found for community: ${communityId}. The community may not exist or is not yet loaded.`,
    );
  }
  // Narrowed to PerspectiveProxy — TypeScript does not narrow through closures so we reassign explicitly
  const perspective: PerspectiveProxy = maybePerspective;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Ensure all required SDNA is installed (sequential to avoid Rust concurrency issues)
  for (const Model of [
    Community,
    Channel,
    App,
    Conversation,
    ConversationSubgroup,
    Topic,
    Embedding,
    SemanticRelationship,
    Message,
    TaskBoard,
    TaskColumn,
    Task,
  ]) {
    await Model.register(perspective);
  }

  // Initialise the signalling service for the community
  const signallingService = useSignallingService(neighbourhood);

  // Model subscriptions (Todo: singularise communities when singular useLive hook available)
  const { data: communities } = useLive(Community, { perspective });
  const { data: allChannels } = useLive(Channel, { perspective });

  // Cache for conversation instances — populated during data fetching, looked up in computeds.
  // Plain Map (not reactive) is sufficient: updates always precede the ref changes that trigger re-computation.
  const conversationCache = new Map<string, Conversation>();

  const processingStateChecked = ref(false);
  const isSynced = ref(true);
  const members = ref<Partial<Profile>[]>([]);
  const membersLoading = ref(true);
  const pinnedConversations = ref<ChannelData[]>([]);
  const pinnedConversationsLoading = ref(false);
  const recentConversations = ref<ChannelData[]>([]);
  const recentConversationsLoading = ref(false);
  const channelsWithConversations = ref<ChannelData[]>([]);
  const channelsWithConversationsLoading = ref(false);
  const newConversationLoading = ref(false);
  const moveConversationLoading = ref(false);

  const isAuthor = computed(() => communities.value[0]?.author === me.value.did);
  const community = computed<Community>(() => communities.value[0]);
  const pinnedChannels = computed(() => allChannels.value.filter((channel) => channel.isPinned));
  const conversationChannels = computed(() => allChannels.value.filter((channel) => channel.isConversation));
  const spaceChannels = computed(() => allChannels.value.filter((channel) => !channel.isConversation));
  const pinnedConversationsWithAgents = computed((): ChannelDataWithAgents[] => {
    return pinnedConversations.value.map((data) => ({
      ...data,
      channel: allChannels.value.find((c) => c.id === data.channelId),
      conversation: data.conversationId ? conversationCache.get(data.conversationId) : undefined,
      agentsInChannel: signallingService.getAgentsInChannel(data.channelId).value,
      agentsInCall: signallingService.getAgentsInCall(data.channelId).value,
      children: undefined,
    }));
  });
  const recentConversationsWithAgents = computed((): ChannelDataWithAgents[] => {
    return recentConversations.value.map((data) => ({
      ...data,
      channel: allChannels.value.find((c) => c.id === data.channelId),
      conversation: data.conversationId ? conversationCache.get(data.conversationId) : undefined,
      agentsInChannel: signallingService.getAgentsInChannel(data.channelId).value,
      agentsInCall: signallingService.getAgentsInCall(data.channelId).value,
      children: undefined,
    }));
  });
  const channelsWithConversationsAndAgents = computed((): ChannelDataWithAgents[] => {
    return channelsWithConversations.value.map((data) => ({
      ...data,
      channel: allChannels.value.find((c) => c.id === data.channelId),
      conversation: data.conversationId ? conversationCache.get(data.conversationId) : undefined,
      agentsInChannel: signallingService.getAgentsInChannel(data.channelId).value,
      agentsInCall: signallingService.getAgentsInCall(data.channelId).value,
      children:
        data.children?.map((child) => ({
          ...child,
          channel: allChannels.value.find((c) => c.id === child.channelId),
          conversation: child.conversationId ? conversationCache.get(child.conversationId) : undefined,
          agentsInChannel: signallingService.getAgentsInChannel(child.channelId).value,
          agentsInCall: signallingService.getAgentsInCall(child.channelId).value,
          children: undefined,
        })) || [],
    }));
  });

  // Signatures used to detect changes in the allChannels subscription that should trigger channel array updates
  const pinnedChannelsSignature = computed(() =>
    allChannels.value
      .filter((channel) => channel.isPinned)
      .map((channel) => `${channel.id}:${channel.name}`)
      .sort()
      .join(','),
  );

  const conversationChannelsSignature = computed(() =>
    allChannels.value
      .filter((channel) => channel.isConversation)
      .map((channel) => `${channel.id}:${channel.name}`)
      .sort()
      .join(','),
  );

  async function getMembers() {
    try {
      membersLoading.value = true;
      const others = (await neighbourhood?.otherAgents()) || [];
      const allMembersDids = [...new Set([...others, me.value.did])];
      // Pre-fill members with partial profiles to speed up display
      members.value = allMembersDids.map((did) => ({ did, profileThumbnailPicture: undefined }));
      // Fetch full profiles with images
      members.value = await Promise.all(allMembersDids.map((did) => getCachedAgentProfile(did, appStore.ad4mClient)));
      membersLoading.value = false;
    } catch (error) {
      console.error('Error loading community members:', error);
      membersLoading.value = false;
    }
  }

  async function getPinnedConversations() {
    if (pinnedConversationsLoading.value) return;
    pinnedConversationsLoading.value = true;

    try {
      // Loop through all the pinned channels and get the conversation data for each
      pinnedConversations.value = await Promise.all(
        pinnedChannels.value.map(async (channel: Channel) => {
          await channel.get({ conversations: true });
          const conversation = channel.conversations[0];
          if (conversation) conversationCache.set(conversation.id, conversation);
          return { channelId: channel.id, conversationId: conversation?.id };
        }),
      );
    } catch (error) {
      console.error('Error loading pinned conversations:', error);
      pinnedConversations.value = [];
    } finally {
      pinnedConversationsLoading.value = false;
    }
  }

  async function getRecentConversations() {
    if (recentConversationsLoading.value) return;
    recentConversationsLoading.value = true;

    try {
      // Get the conversation data for each of the conversation channels and determine the last activity timestamp for each
      const conversations = await Promise.all(
        conversationChannels.value.map(async (channel: Channel) => {
          await channel.get({ conversations: true });
          const conversation = channel.conversations[0];

          if (!conversation) return null;
          conversationCache.set(conversation.id, conversation);

          // If there are unprocessed items, use the latest unprocessed items timestamp
          let lastActivity: string | null = null;
          const unprocessedItems = await channel.unprocessedItems();
          if (unprocessedItems.length) {
            const lastUnprocessedItem = unprocessedItems.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            )[0];
            lastActivity = lastUnprocessedItem.timestamp;
          } else if (conversation.summary === 'Content will appear when the first items have been processed...') {
            // If the conversation is an empty placeholder use the conversations timestamp
            lastActivity = conversation.createdAt;
          } else {
            // If no subgroups exist, use the conversation timestamp
            const subgroups = await conversation.subgroups();
            if (!subgroups.length) lastActivity = conversation.createdAt;
            else {
              // If no items exist in the last subgroup, use the subgroup timestamp
              const lastSubgroup = subgroups[subgroups.length - 1];
              const items = await lastSubgroup.itemsData();
              if (!items.length) lastActivity = lastSubgroup.createdAt;
              else {
                // Finally, use the timestamp of the last item in the last subgroup
                const lastItem = items.sort(
                  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                )[0];
                lastActivity = lastItem.timestamp;
              }
            }
          }

          return { channelId: channel.id, conversationId: conversation.id, lastActivity };
        }),
      );

      // Sort conversations by last activity timestamp
      const conversationsSortedByLastActivity = conversations
        .filter((c) => c !== null)
        .sort((a, b) => new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime());

      recentConversations.value = conversationsSortedByLastActivity as ChannelData[];
    } catch (error) {
      console.error('Error loading recent conversations:', error);
      recentConversations.value = [];
    } finally {
      recentConversationsLoading.value = false;
    }
  }

  async function getChannelsWithConversations() {
    if (channelsWithConversationsLoading.value) return;
    channelsWithConversationsLoading.value = true;

    try {
      // Loop through all the space channels and get the conversations in each
      channelsWithConversations.value = await Promise.all(
        spaceChannels.value.map(async (channel: Channel) => {
          // Get all nested conversation channels — linked via CHANNEL predicate (same as startNewConversation)
          const links = await perspective.get(new LinkQuery({ source: channel.id, predicate: CHANNEL }));
          const childChannelIds = new Set(links.map((l) => l.data.target));
          const nestedConversationChannels = allChannels.value.filter(
            (ch) => ch.isConversation && childChannelIds.has(ch.id),
          );

          // Get the conversation data for each of the nested conversation channels
          const conversations = await Promise.all(
            nestedConversationChannels.map(async (childChannel: Channel) => {
              await childChannel.get({ conversations: true });
              const conversation = childChannel.conversations[0];
              if (conversation) conversationCache.set(conversation.id, conversation);
              return { channelId: childChannel.id, conversationId: conversation?.id };
            }),
          );

          return { channelId: channel.id, children: conversations };
        }),
      );
    } catch (error) {
      console.error('Error loading channels with conversations:', error);
      channelsWithConversations.value = [];
    } finally {
      channelsWithConversationsLoading.value = false;
    }
  }

  async function startNewConversation(parentChannelId?: string) {
    newConversationLoading.value = true;

    try {
      // Create the channel
      const channel = new Channel(perspective);
      channel.name = '';
      channel.description = '';
      channel.isConversation = true;
      channel.isPinned = false;
      await channel.save();
      await perspective.add(
        new Link({ source: parentChannelId || 'ad4m://self', predicate: CHANNEL, target: channel.id }),
      );

      // Create the first placeholder conversation
      const conversation = new Conversation(perspective);
      conversation.conversationName = 'New conversation';
      conversation.summary = 'Content will appear when the first items have been processed...';
      await conversation.save();
      await perspective.add(new Link({ source: channel.id, predicate: CHANNEL_CONVERSATION, target: conversation.id }));

      // Attach the chat app
      const fluxApps = await getAllFluxApps();
      const chatAppData = fluxApps.find((app) => app.pkg === DEFAULT_CHAT_APP_PKG);
      if (!chatAppData) throw new Error(`Chat app ${DEFAULT_CHAT_APP_PKG} not found`);

      const { name, description, icon, pkg } = chatAppData;

      const chatApp = new App(perspective);
      chatApp.name = name;
      chatApp.description = description;
      chatApp.icon = icon;
      chatApp.pkg = pkg;
      await chatApp.save();
      await perspective.add(new Link({ source: channel.id, predicate: 'flux://has_app', target: chatApp.id }));

      // Update the recent conversations
      getRecentConversations();

      // Navigate to the new channel
      const communityId = route.params.communityId as string;
      router.push({
        name: 'view',
        params: { communityId, channelId: stripChannelPrefix(channel.id), viewId: 'conversation' },
      });
      uiStore.setCallWindowOpen(true);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      appStore.showDangerToast({ message: 'Failed to create conversation' });
      throw error;
    } finally {
      newConversationLoading.value = false;
    }
  }

  async function moveConversation(conversationChannelId: string, newSpaceChannelId: string, conversationName?: string) {
    moveConversationLoading.value = true;

    try {
      // Get the link from the conversation channel to its current parent
      const existingLinks = await perspective.get(new LinkQuery({ predicate: CHANNEL, target: conversationChannelId }));
      const link = existingLinks[0];
      if (!link) {
        console.warn(`No parent link found for conversation ${conversationChannelId}`);
        appStore.showDangerToast({
          message: `Failed to move conversation "${conversationName || conversationChannelId}": no parent link found`,
        });
        return;
      }

      // Skip if the conversation is already linked to the target channel
      if (link.source === newSpaceChannelId) return;

      // Update the link to point to the new parent channel
      await perspective.update(link, {
        source: newSpaceChannelId,
        predicate: CHANNEL,
        target: conversationChannelId,
      });

      // Display success message
      appStore.showSuccessToast({
        message:
          newSpaceChannelId === 'ad4m://self'
            ? `Successfully removed conversation "${conversationName || conversationChannelId}" from channel`
            : `Successfully moved conversation "${conversationName || conversationChannelId}" to channel ${newSpaceChannelId}`,
      });

      // Refresh the channels list
      getChannelsWithConversations();
    } catch (error) {
      console.error('Failed to move conversation:', error);
      // Display error message
      appStore.showDangerToast({
        message:
          newSpaceChannelId === 'ad4m://self'
            ? `Failed to remove conversation "${conversationName || conversationChannelId}" from channel`
            : `Failed to move conversation "${conversationName || conversationChannelId}" to channel ${newSpaceChannelId}`,
      });
      throw error;
    } finally {
      moveConversationLoading.value = false;
    }
  }

  function getParentChannel(channelId: string): Channel | undefined {
    const parentData = channelsWithConversations.value.find((c) =>
      c.children?.some((child) => child.channelId === channelId),
    );
    if (!parentData) return undefined;
    return allChannels.value.find((c) => c.id === parentData.channelId);
  }

  function getConversation(channelId: string): Conversation | undefined {
    const data = recentConversations.value.find((c) => c.channelId === channelId);
    if (!data?.conversationId) return undefined;
    return conversationCache.get(data.conversationId);
  }

  // Track channel participants automatically
  function handleParticipantTracking(link: any) {
    if (link.data.predicate !== CHANNEL) return null;
    if (!link.author) return null;

    const channelId = link.data.source;
    const channel = allChannels.value.find((c) => c.id === channelId);
    if (!channel) return null;

    if (channel.participants && channel.participants.includes(link.author)) return null;

    // Add participant link
    perspective
      .addLinks([{ source: channelId, predicate: 'flux://has_participant', target: link.author }])
      .catch((error) => {
        console.error('Failed to add participant to channel:', {
          channelId,
          author: link.author,
          error,
        });
      });

    return null;
  }

  // Initialize sync state listener
  const syncStateListener = (state: PerspectiveState) => {
    // @ts-ignore
    isSynced.value = state === PerspectiveState.Synced || state === '"Synced"'; // Todo: state should be "SYNCED" not ""Synced""
    return null;
  };
  perspective.addSyncStateChangeListener(syncStateListener);

  // Initialize participant tracking
  perspective.addListener('link-added', handleParticipantTracking);

  // Cleanup function to remove all listeners
  function cleanup() {
    perspective.removeListener('link-added', handleParticipantTracking);
  }

  getMembers();

  watch(pinnedChannelsSignature, getPinnedConversations);
  watch(conversationChannelsSignature, () => {
    getRecentConversations();
    getChannelsWithConversations();
  });
  watch(spaceChannels, getChannelsWithConversations);

  // Find processing tasks in the community when the conversations first load
  watch(recentConversations, () => {
    if (aiEnabled.value && !processingStateChecked.value) {
      processingStateChecked.value = true;
      // Delay by heart beat interval to allow time for signals to arrive
      setTimeout(() => aiStore.findProcessingTasksInCommunity(perspective.sharedUrl || ''), HEARTBEAT_INTERVAL);
    }
  });

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
    getParentChannel,
    getConversation,
    cleanup,
  };
}

export const CommunityServiceKey: InjectionKey<Awaited<CommunityService>> = Symbol('FluxCommunityService');

export function useCommunityService() {
  const service = inject(CommunityServiceKey);
  if (!service)
    throw new Error('Unable to inject service. Make sure your component is a child of the CommunityView component.');
  return service;
}
