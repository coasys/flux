import { useAiStore, useAppStore, useUiStore } from '@/stores';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { restoreNeighbourhoodPrefix, stripChannelPrefix } from '@/utils/routeUtils';
import { upsertById } from '@/utils/upsertById';
import { Link, LinkQuery, NeighbourhoodProxy, PerspectiveProxy, PerspectiveState } from '@coasys/ad4m';
import { useLiveQuery } from '@coasys/ad4m-vue-hooks';
import {
  App,
  Channel,
  ChannelSummary,
  Community,
  Conversation,
  ConversationSubgroup,
  Embedding,
  ensureModelsRegistered,
  getAllFluxApps,
  Message,
  SemanticRelationship,
  TaskBoard,
  TaskColumn,
  Topic,
  Task,
} from '@coasys/flux-api';
import { community as communityPredicates } from '@coasys/flux-constants';

const { CHANNEL } = communityPredicates;
import { AgentData, Profile, SignallingService } from '@coasys/flux-types';
import { storeToRefs } from 'pinia';
import { computed, ComputedRef, inject, InjectionKey, markRaw, ref, Ref, watch } from 'vue';
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
  channel?: ChannelSummary;
  conversationId?: string;
  conversation?: Conversation;
  lastActivity?: string;
  children?: ChannelDataWithAgents[];
  agentsInChannel: AgentData[];
  agentsInCall: AgentData[];
}

export interface CommunityService {
  perspective: PerspectiveProxy;
  neighbourhood: NeighbourhoodProxy | null;
  signallingService: SignallingService | null;
  isSynced: Ref<boolean>;
  isAuthor: ComputedRef<boolean>;
  community: ComputedRef<Community>;
  members: Ref<Partial<Profile>[]>;
  membersLoading: Ref<boolean>;
  allChannels: Ref<ChannelSummary[]>;
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
  getParentChannel: (channelId: string) => ChannelSummary | undefined;
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
  const communityIdParam = route.params.communityId as string;
  // Try neighbourhood:// first, then private:// for local-only perspectives
  const maybePerspective = appStore.getPerspective(restoreNeighbourhoodPrefix(communityIdParam))
    || appStore.getPerspective(`private://${communityIdParam}`);
  if (!maybePerspective) {
    const communityId = route.params.communityId as string;
    console.error(`Failed to get perspective for community: ${communityId}`);
    throw new Error(
      `Perspective not found for community: ${communityId}. The community may not exist or is not yet loaded.`,
    );
  }
  // Narrowed to PerspectiveProxy — TypeScript does not narrow through closures so we reassign explicitly
  // markRaw prevents Vue from wrapping PerspectiveProxy in a reactive Proxy, which breaks
  // TypeScript #private fields (WeakMap lookup fails when 'this' is a Proxy).
  const perspective: PerspectiveProxy = markRaw(maybePerspective);
  // Only get neighbourhood proxy for shared perspectives — private perspectives
  // have no sharedUrl and sendBroadcast will fail with error noise.
  const neighbourhood = perspective.sharedUrl
    ? (perspective.getNeighbourhoodProxy?.() || null)
    : null;

  // Ensure all required SDNA is installed. ensureModelsRegistered diffs against the
  // perspective's actual state first, so re-mounting this composable (e.g. navigating
  // between communities) doesn't write a duplicate copy of every shape each time.
  await ensureModelsRegistered(perspective, [
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
  ]);

  // Initialise the signalling service for the community
  const signallingService = neighbourhood ? useSignallingService(neighbourhood) : null;

  // Model subscriptions
  // Community query is perspective-scoped (typically one per perspective — low cost).
  // Use ChannelSummary — lightweight model without @HasMany relations.
  // Property getters run by default (deepQuery=true) via batched VALUES queries.
  const { data: communities, loading: communitiesLoading, error: communitiesError } = useLiveQuery(Community, perspective);
  const { data: allChannels, loading: channelsLoading, error: channelsError } = useLiveQuery(ChannelSummary, perspective);

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
      agentsInChannel: signallingService?.getAgentsInChannel(data.channelId).value || [],
      agentsInCall: signallingService?.getAgentsInCall(data.channelId).value || [],
      children: undefined,
    }));
  });
  const recentConversationsWithAgents = computed((): ChannelDataWithAgents[] => {
    return recentConversations.value.map((data) => ({
      ...data,
      channel: allChannels.value.find((c) => c.id === data.channelId),
      conversation: data.conversationId ? conversationCache.get(data.conversationId) : undefined,
      agentsInChannel: signallingService?.getAgentsInChannel(data.channelId).value || [],
      agentsInCall: signallingService?.getAgentsInCall(data.channelId).value || [],
      children: undefined,
    }));
  });
  const channelsWithConversationsAndAgents = computed((): ChannelDataWithAgents[] => {
    return channelsWithConversations.value.map((data) => ({
      ...data,
      channel: allChannels.value.find((c) => c.id === data.channelId),
      conversation: data.conversationId ? conversationCache.get(data.conversationId) : undefined,
      agentsInChannel: signallingService?.getAgentsInChannel(data.channelId).value || [],
      agentsInCall: signallingService?.getAgentsInCall(data.channelId).value || [],
      children:
        data.children?.map((child) => ({
          ...child,
          channel: allChannels.value.find((c) => c.id === child.channelId),
          conversation: child.conversationId ? conversationCache.get(child.conversationId) : undefined,
          agentsInChannel: signallingService?.getAgentsInChannel(child.channelId).value || [],
          agentsInCall: signallingService?.getAgentsInCall(child.channelId).value || [],
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
      // Single SPARQL query — avoids iterative channel.get({ conversations: true })
      const results = await Channel.pinnedConversations(perspective);

      // Hydrate conversations so properties like conversationName are available
      const newPinnedIds = results
        .filter((r) => r.conversationId && !conversationCache.has(r.conversationId))
        .map((r) => r.conversationId!);
      await Promise.all(
        newPinnedIds.map(async (id) => {
          const conv = new Conversation(perspective, id);
          try {
            await conv.get();
          } catch (e) {
            console.warn(`Failed to hydrate pinned conversation ${id}:`, e);
          }
          conversationCache.set(id, conv);
        }),
      );

      pinnedConversations.value = results;
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
      // Single SPARQL query — avoids N×M×K iterative graph walk
      // (was: for each channel → get conversations → unprocessedItems → subgroups → items)
      const results = await Channel.recentConversations(perspective, 20);

      // Populate conversation cache — hydrate with .get() so properties like
      // conversationName are available for display in the sidebar.
      const newConvIds = results
        .filter((r) => r.conversationId && !conversationCache.has(r.conversationId))
        .map((r) => r.conversationId!);
      await Promise.all(
        newConvIds.map(async (id) => {
          const conv = new Conversation(perspective, id);
          try {
            await conv.get();
          } catch (e) {
            console.warn(`Failed to hydrate conversation ${id}:`, e);
          }
          conversationCache.set(id, conv);
        }),
      );

      recentConversations.value = results as ChannelData[];
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
      // Phase 1: Collect all child channel IDs per space channel (parallel link queries)
      const channelChildMap = await Promise.all(
        spaceChannels.value.map(async (channel) => {
          const links = await perspective.get(new LinkQuery({ source: channel.id, predicate: CHANNEL }));
          const childChannelIds = new Set(links.map((l) => l.data.target));
          const nestedConversationChannels = allChannels.value.filter(
            (ch) => ch.isConversation && childChannelIds.has(ch.id),
          );
          return { channelId: channel.id, children: nestedConversationChannels };
        }),
      );

      // Phase 2: Batch all conversation lookups into a single flat Promise.all
      // instead of nested per-space-channel loops
      const allConvChannels = channelChildMap.flatMap((entry) =>
        entry.children.map((ch) => ({ spaceChannelId: entry.channelId, childChannel: ch })),
      );

      const conversationResults = await Promise.all(
        allConvChannels.map(async ({ childChannel }) => {
          try {
            const conversation = await Conversation.findOne(perspective, {
              parent: { model: Channel, id: childChannel.id },
            });
            if (conversation) conversationCache.set(conversation.id, conversation);
            return { channelId: childChannel.id, conversationId: conversation?.id };
          } catch (e) {
            console.warn(`Failed to find conversation for channel ${childChannel.id}:`, e);
            return { channelId: childChannel.id };
          }
        }),
      );

      // Phase 3: Re-group results by space channel
      const convByChildId = new Map(conversationResults.map((r) => [r.channelId, r]));
      channelsWithConversations.value = channelChildMap.map((entry) => ({
        channelId: entry.channelId,
        children: entry.children.map((ch) => convByChildId.get(ch.id) || { channelId: ch.id }),
      }));
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
      const channel = await Channel.create(perspective, {
        name: '',
        description: '',
        isConversation: true,
        isPinned: false,
      });
      await perspective.add(
        new Link({ source: parentChannelId || 'ad4m://self', predicate: CHANNEL, target: channel.id }),
      );
      allChannels.value = upsertById(allChannels.value, channel);

      // Create the first placeholder conversation
      await Conversation.create(
        perspective,
        {
          conversationName: 'New conversation',
          summary: 'Content will appear when the first items have been processed...',
        },
        { parent: { model: Channel, id: channel.id } },
      );

      // Attach the chat app
      const fluxApps = await getAllFluxApps();
      const chatAppData = fluxApps.find((app) => app.pkg === DEFAULT_CHAT_APP_PKG);
      if (!chatAppData) throw new Error(`Chat app ${DEFAULT_CHAT_APP_PKG} not found`);

      const { name, description, icon, pkg } = chatAppData;

      await App.create(perspective, { name, description, icon, pkg }, { parent: { model: Channel, id: channel.id } });

      // Update the recent conversations — await so sidebar reflects the new entry before navigation
      await getRecentConversations();

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

  function getParentChannel(channelId: string): ChannelSummary | undefined {
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

  // Initialize sync state listener
  const syncStateListener = (state: PerspectiveState) => {
    // @ts-ignore
    isSynced.value = state === PerspectiveState.Synced || state === '"Synced"'; // Todo: state should be "SYNCED" not ""Synced""
    return null;
  };
  perspective.addSyncStateChangeListener(syncStateListener);

  // Track channel participants automatically.
  //
  // Previously this used `perspective.addListener('link-added', ...)`, which
  // is a perspective-scoped firehose — every link added anywhere in the
  // perspective wakes every listener.  We now drive the same logic from a
  // targeted SPARQL subscription that only fires when the set of distinct
  // `(channel, author)` pairs over the `flux://has_channel` predicate
  // changes.  The reified link's author is exposed via
  // `?_r ad4m:author ?author`, so the subscription observes exactly the
  // signal we used to read off `link.author`.
  //
  // The dedup set keeps `addLinks` RPCs idempotent (the addLink itself is
  // also idempotent on the executor side, but the dedup avoids the round
  // trip).  Each subscription fire triggers a single `LinkQuery` refetch so
  // the handler does not depend on the SPARQL binding shape — robust
  // against any future result-shape changes.
  const knownParticipants = new Set<string>();
  let channelLinksSub: { dispose: () => void } | null = null;
  let participantTrackingCancelled = false;

  async function refreshParticipantsFromChannelLinks() {
    try {
      const links = await perspective.get(new LinkQuery({ predicate: CHANNEL }));
      for (const link of links) {
        if (!link.author) continue;
        const channelId = link.data.source;
        const channel = allChannels.value.find((c) => c.id === channelId);
        if (!channel) continue;

        const key = `${channelId}::${link.author}`;
        if (knownParticipants.has(key)) continue;
        knownParticipants.add(key);

        perspective
          .addLinks([{ source: channelId, predicate: 'flux://has_participant', target: link.author }])
          .catch((error) => {
            knownParticipants.delete(key);
            console.error('Failed to add participant to channel:', {
              channelId,
              author: link.author,
              error,
            });
          });
      }
    } catch (error) {
      console.error('Error refreshing channel participants:', error);
    }
  }

  (async () => {
    try {
      // SELECT every distinct `(source, author)` over the `flux://has_channel`
      // predicate.  The reifier metadata is queried via the RDF 1.2 `reifies`
      // pattern that the rest of the model query pipeline uses.
      const sub = await perspective.subscribeQuery(`
        SELECT DISTINCT ?source ?author WHERE {
          ?_r <http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies> <<( ?source <${CHANNEL}> ?_target )>> .
          ?_r <ad4m://ontology/author> ?author .
        }
      `);
      if (participantTrackingCancelled) {
        sub.dispose();
        return;
      }
      channelLinksSub = sub;
      sub.onResult(() => refreshParticipantsFromChannelLinks());
    } catch (error) {
      console.error('Failed to subscribe to channel-link author pairs:', error);
    }
  })();

  // Cleanup function to tear down active subscriptions
  function cleanup() {
    participantTrackingCancelled = true;
    channelLinksSub?.dispose();
  }

  getMembers();

  watch(pinnedChannelsSignature, getPinnedConversations, { immediate: true });
  watch(conversationChannelsSignature, () => {
    getRecentConversations();
    getChannelsWithConversations();
  }, { immediate: true });
  watch(spaceChannels, getChannelsWithConversations, { immediate: true });

  // Find processing tasks in the community when the conversations first load.
  // Watch BOTH recentConversations and allChannels — findProcessingTasksInCommunity
  // uses recentConversationsWithAgents, which joins the two. If we gate only on
  // recentConversations, the one-shot processingStateChecked flag can close before
  // allChannels loads, causing findProcessingTasksInCommunity to see all
  // channel: undefined entries and silently skip every task.
  watch([recentConversations, allChannels], () => {
    if (
      aiEnabled.value &&
      !processingStateChecked.value &&
      recentConversations.value.length > 0 &&
      allChannels.value.length > 0
    ) {
      processingStateChecked.value = true;
      // Delay by heartbeat interval to allow time for signals to arrive
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
