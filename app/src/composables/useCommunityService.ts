import { useAiStore, useAppStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { LinkQuery, NeighbourhoodProxy, PerspectiveProxy, PerspectiveState } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-vue-hooks";
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
  Topic,
} from "@coasys/flux-api";
import { AgentData, Profile, SignallingService } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, inject, InjectionKey, ref, Ref, toRaw, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { HEARTBEAT_INTERVAL, useSignallingService } from "./useSignallingService";

export interface ChannelData {
  channel: Partial<Channel>;
  conversation?: Partial<Conversation>;
  children?: ChannelData[];
  // notifications?: any;
  // hasNewMessages?: boolean;
  lastActivity?: string;
  agentsInChannel?: AgentData[];
  agentsInCall?: AgentData[];
  allAuthors?: string[];
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
  moveConversation: (
    conversationChannelId: string,
    newSpaceChannelId: string,
    conversationName?: string
  ) => Promise<void>;
  getParentChannel: (channelId: string) => Partial<Channel> | undefined;
  getConversation: (channelId: string) => Partial<Conversation> | undefined;
}

const DEFAULT_CHAT_APP_PKG = "@coasys/flux-chat-view";

export async function createCommunityService(): Promise<CommunityService> {
  const route = useRoute();
  const router = useRouter();
  const appStore = useAppStore();
  const aiStore = useAiStore();
  const { me } = storeToRefs(appStore);
  const { defaultLLM } = storeToRefs(aiStore);

  // Get the perspective and neighbourhood proxies
  const perspective = (await appStore.ad4mClient.perspective.byUUID(
    route.params.communityId as string
  )) as PerspectiveProxy;
  const neighbourhood = perspective.getNeighbourhoodProxy();

  // Ensure all required SDNA is installed
  await Promise.all([
    perspective.ensureSDNASubjectClass(Community),
    perspective.ensureSDNASubjectClass(Channel),
    perspective.ensureSDNASubjectClass(App),
    perspective.ensureSDNASubjectClass(Conversation),
    perspective.ensureSDNASubjectClass(ConversationSubgroup),
    perspective.ensureSDNASubjectClass(Topic),
    perspective.ensureSDNASubjectClass(Embedding),
    perspective.ensureSDNASubjectClass(SemanticRelationship),
    perspective.ensureSDNASubjectClass(Message),
  ]);

  // Initialise the signalling service for the community
  const signallingService = useSignallingService(neighbourhood);

  // Model subscriptions (Todo: singularise communities when singular useModel hook available)
  const { entries: communities } = useModel({ perspective, model: Community });
  const { entries: allChannels } = useModel({ perspective, model: Channel });

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

  // Signatures used to detect changes in the allChannels subscription that should trigger channel array updates
  const pinnedChannelsSignature = computed(() =>
    allChannels.value
      .filter((channel) => channel.isPinned)
      .map((channel) => `${channel.baseExpression}:${channel.name}`)
      .sort()
      .join(",")
  );

  const conversationChannelsSignature = computed(() =>
    allChannels.value
      .filter((channel) => channel.isConversation)
      .map((channel) => `${channel.baseExpression}:${channel.name}`)
      .sort()
      .join(",")
  );

  // TODO: should update when any channel name changes and when nested channels are added or removed
  const nestedChannelsSignature = computed(
    () => {}
    // allChannels.value
    //   .filter(channel => !channel.isConversation)
    //   .map(spaceChannel => {
    //     const parentChannelData = channelsWithConversations.value.find((c) =>
    //       c.children?.some((child) => child.channel.baseExpression === channelId)
    //     );

    //     // Get nested conversation channels for this space channel
    //     const nestedConversations = allChannels.value
    //       .filter(channel =>
    //         channel.isConversation &&

    //       )
    //       .map(nested => `${nested.baseExpression}:${nested.name}`)
    //       .sort()
    //       .join('|');

    //     // Combine space channel info with its nested channels
    //     return `${spaceChannel.baseExpression}:${spaceChannel.name}[${nestedConversations}]`;
    //   })
    //   .sort()
    //   .join(',')
  );

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
    if (pinnedConversationsLoading.value) return;
    pinnedConversationsLoading.value = true;

    // console.log("*** Loading pinned conversations ***");

    try {
      // Loop through all the pinned channels and get the conversation data for each
      pinnedConversations.value = await Promise.all(
        pinnedChannels.value.map(async (channel: Channel) => {
          const conversation = (await Conversation.findAll(perspective, { source: channel.baseExpression }))[0];
          const allAuthors = await toRaw(channel).allAuthors();
          return { conversation, channel, allAuthors };
        })
      );
    } catch (error) {
      console.error("Error loading pinned conversations:", error);
      pinnedConversations.value = [];
    } finally {
      pinnedConversationsLoading.value = false;
    }
  }

  async function getRecentConversations() {
    if (recentConversationsLoading.value) return;
    recentConversationsLoading.value = true;

    // console.log("*** Loading recent conversations ***");

    // Get the conversation data for each of the conversation channels and determine the last activity timestamp for each
    const conversations = await Promise.all(
      conversationChannels.value.map(async (channel: Channel) => {
        const conversation = (await Conversation.findAll(perspective, { source: channel.baseExpression }))[0];

        if (!conversation) return null;

        // If there are unprocessed items, use the latest unprocessed items timestamp
        let lastActivity: string | null = null;
        const channelRaw = toRaw(channel);
        const unprocessedItems = await channelRaw.unprocessedItems();
        const allAuthors = await channelRaw.allAuthors();
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

        return { conversation, channel, lastActivity, allAuthors };
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
    if (channelsWithConversationsLoading.value) return;
    channelsWithConversationsLoading.value = true;

    // console.log("*** Loading channels with conversations ***");

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
            const allAuthors = await toRaw(childChannel).allAuthors();
            // TODO: investigate and remove explicit baseExpression from channel if possible
            // return { channel: childChannel, conversation, allAuthors };
            return {
              channel: { ...childChannel, baseExpression: childChannel.baseExpression },
              conversation,
              allAuthors,
            };
          })
        );

        return { channel, children: conversations, allAuthors: await toRaw(channel).allAuthors() };
      })
    );

    channelsWithConversationsLoading.value = false;
  }

  async function startNewConversation(parentChannelId?: string) {
    newConversationLoading.value = true;

    try {
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
      const chatAppData = fluxApps.find((app) => app.pkg === DEFAULT_CHAT_APP_PKG);
      if (!chatAppData) throw new Error(`Chat app ${DEFAULT_CHAT_APP_PKG} not found`);

      const { name, description, icon, pkg } = chatAppData;

      const chatApp = new App(perspective, undefined, channel.baseExpression);
      chatApp.name = name;
      chatApp.description = description;
      chatApp.icon = icon;
      chatApp.pkg = pkg;
      await chatApp.save();

      // Update the recent conversations
      getRecentConversations();

      // Navigate to the new channel
      const communityId = route.params.communityId as string;
      router.push({ name: "view", params: { communityId, channelId: channel.baseExpression, viewId: "conversation" } });
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      appStore.showDangerToast({ message: "Failed to create conversation" });
      throw error;
    } finally {
      newConversationLoading.value = false;
    }
  }

  async function moveConversation(conversationChannelId: string, newSpaceChannelId: string, conversationName?: string) {
    moveConversationLoading.value = true;

    try {
      console.log(
        `➡️ Moving conversation "${conversationName || conversationChannelId}" to channel ${newSpaceChannelId}`
      );

      // Get the link from the conversation channel to its current parent
      const link = (
        await perspective.get(new LinkQuery({ predicate: "ad4m://has_child", target: conversationChannelId }))
      )[0];

      // Skip if the conversation is already linked to the target channel
      if (link.source === newSpaceChannelId) return;

      // Update the link to point to the new parent channel
      await perspective.update(link, {
        source: newSpaceChannelId,
        predicate: "ad4m://has_child",
        target: conversationChannelId,
      });

      // Display success message
      appStore.showSuccessToast({
        message:
          newSpaceChannelId === "ad4m://self"
            ? `Succesfully removed conversation "${conversationName || conversationChannelId}" from channel`
            : `Succesfully moved conversation "${conversationName || conversationChannelId}" to channel ${newSpaceChannelId}`,
      });

      // Refresh the channels list
      getChannelsWithConversations();
    } catch (error) {
      console.error("Failed to move conversation:", error);
      // Display error message
      appStore.showDangerToast({
        message:
          newSpaceChannelId === "ad4m://self"
            ? `Failed to remove conversation "${conversationName || conversationChannelId}" from channel`
            : `Failed to move conversation "${conversationName || conversationChannelId}" to channel ${newSpaceChannelId}`,
      });
      throw error;
    } finally {
      moveConversationLoading.value = false;
    }
  }

  function getParentChannel(channelId: string): Partial<Channel> | undefined {
    const parentChannelData = channelsWithConversations.value.find((c) =>
      c.children?.some((child) => child.channel.baseExpression === channelId)
    );
    return parentChannelData ? parentChannelData.channel : undefined;
  }

  function getConversation(channelId: string) {
    const conversationData = recentConversations.value.find((c) => c.channel.baseExpression === channelId);
    return conversationData ? conversationData.conversation : undefined;
  }

  // Initialize sync state listener
  perspective.addSyncStateChangeListener((state: PerspectiveState) => {
    // @ts-ignore
    isSynced.value = state === PerspectiveState.Synced || state === '"Synced"'; // Todo: state should be "SYNCED" not ""Synced""
    return null;
  });

  getMembers();

  watch(pinnedChannelsSignature, getPinnedConversations);
  watch(conversationChannelsSignature, getRecentConversations);
  // TODO: should update when any channel name changes or when nested channels are added or removed from a space channel
  watch(spaceChannels, getChannelsWithConversations);

  // Find processing tasks in the community when the conversations first load
  watch(recentConversations, () => {
    if (defaultLLM.value && !processingStateChecked.value) {
      processingStateChecked.value = true;
      // Delay by heart beat interval to allow time for signals to arrive
      setTimeout(() => aiStore.findProcessingTasksInCommunity(perspective.uuid), HEARTBEAT_INTERVAL);
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
  };
}

export const CommunityServiceKey: InjectionKey<Awaited<CommunityService>> = Symbol("FluxCommunityService");

export function useCommunityService() {
  const service = inject(CommunityServiceKey);
  if (!service)
    throw new Error("Unable to inject service. Make sure your component is a child of the CommunityView component.");
  return service;
}
