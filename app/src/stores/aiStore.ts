import { CommunityService } from '@/composables/useCommunityService';
import { useAppStore, useCommunityServiceStore, useRouteMemoryStore } from '@/stores';
import { AIModelLoadingStatus, AITask } from '@coasys/ad4m';
import { Model } from '@coasys/ad4m/lib/src/ai/AIResolver';
import { Channel } from '@coasys/flux-api';
import { ProcessingState, SignallingService } from '@coasys/flux-types';
import { SynergyItem } from '@coasys/flux-utils';
import { defineStore, storeToRefs } from 'pinia';
import { computed, onUnmounted, ref, toRaw, unref, watch } from 'vue';

export const transcriptionModels = [
  'Tiny', // The tiny model.
  'QuantizedTiny', // The tiny model quantized to run faster.
  'TinyEn', // The tiny model with only English support.
  'QuantizedTinyEn', // The tiny model with only English support quantized to run faster.
  'Base', // The base model.
  'BaseEn', // The base model with only English support.
  'Small', // The small model.
  'SmallEn', // The small model with only English support.
  'Medium', // The medium model.
  'MediumEn', // The medium model with only English support.
  'QuantizedDistilMediumEn', // The medium model with only English support quantized to run faster.
  'Large', // The large model.
  'LargeV2', // The large model v2.
  'DistilMediumEn', // The distil-medium english model.
  'DistilLargeV2', // The distil-large model.
  'DistilLargeV3', // The distil-large-v3 model.
  'QuantizedDistilLargeV3', // The quantized distil-large-v3 model.
];

export const llmProcessingSteps = [
  'Getting conversation',
  'Processing items',
  'LLM Group Detection',
  'LLM Topic Generation',
  'LLM Conversation Updates',
  'Generating New Groupings',
  'Generating Vector Embeddings',
  'Processing complete. Committing batch!',
];

export const MIN_ITEMS_TO_PROCESS = 5;
export const MAX_ITEMS_TO_PROCESS = 10;
export const PROCESSING_ITEMS_DELAY = 3;

export type ProcessingQueueItem = { communityId: string; channel: Partial<Channel> };

export const useAiStore = defineStore(
  'aiStore',
  () => {
    const appStore = useAppStore();
    const routeMemoryStore = useRouteMemoryStore();
    const communityServiceStore = useCommunityServiceStore();

    const { ad4mClient, me } = storeToRefs(appStore);
    const { currentRoute } = storeToRefs(routeMemoryStore);

    const loadingAIData = ref(false);
    const processing = ref(false);
    const processingState = ref<Partial<ProcessingState> | null>(null);
    const processingQueue = ref<ProcessingQueueItem[]>([]);
    const allModels = ref<Model[]>([]);
    const allTasks = ref<AITask[]>([]);
    const defaultLLM = ref<Model | null>(null);
    const llmLoadingStatus = ref<AIModelLoadingStatus | null>(null);
    const whisperLoadingStatus = ref<AIModelLoadingStatus | null>(null);
    const whisperTinyLoadingStatus = ref<AIModelLoadingStatus | null>(null);
    const transcriptionEnabled = ref(true);
    const transcriptionModel = ref('Base');
    const transcriptionPreviewTimeout = ref(0.4);
    const transcriptionMessageTimeout = ref(3);
    const transcriptionMaxChars = ref(1000);

    const aiEnabled = computed(() => Boolean(defaultLLM.value && llmLoadingStatus.value?.status === 'Ready'));

    function setTranscriptionEnabled(payload: boolean): void {
      transcriptionEnabled.value = payload;
    }

    function toggleTranscriptionEnabled(): void {
      transcriptionEnabled.value = !transcriptionEnabled.value;
    }

    function setTranscriptionModel(payload: string): void {
      transcriptionModel.value = payload;
    }

    function setTranscriptionPreviewTimeout(payload: number): void {
      transcriptionPreviewTimeout.value = payload;
    }

    function setTranscriptionMessageTimeout(payload: number): void {
      transcriptionMessageTimeout.value = payload;
    }

    async function loadAIData() {
      if (loadingAIData.value) return;

      loadingAIData.value = true;

      try {
        allModels.value = await ad4mClient.value.ai.getModels();
        allTasks.value = await ad4mClient.value.ai.tasks();
        defaultLLM.value = await ad4mClient.value.ai.getDefaultModel('LLM');

        // Get model statuses
        const llm = allModels.value.find((model) => model.modelType === 'LLM');
        if (llm) llmLoadingStatus.value = await ad4mClient.value.ai.modelLoadingStatus(llm.id);

        const whisper = allModels.value.find((model) => model.name === 'Whisper');
        if (whisper) whisperLoadingStatus.value = await ad4mClient.value.ai.modelLoadingStatus(whisper.id);

        const whisperTiny = allModels.value.find((model) => model.name === 'Whisper tiny quantized');
        if (whisperTiny) whisperTinyLoadingStatus.value = await ad4mClient.value.ai.modelLoadingStatus(whisperTiny.id);

        loadingAIData.value = false;
      } catch (error) {
        console.error('Failed to load AI data:', error);
        loadingAIData.value = false;
      }
    }

    function checkItemsForResponsibility(
      signallingService: SignallingService,
      items: SynergyItem[],
      increment = 0,
    ): boolean {
      // Find the nth item
      const nthItem = items[increment];
      if (!nthItem) return false;

      // If we're the author, we're responsible
      if (nthItem.author === me.value.did) return true;

      // If not, check if the author has AI enabled and can process items themselves
      const agentState = signallingService.getAgentState(nthItem.author);
      if (agentState?.aiEnabled) return false;

      // If they can't, re-run the check on the next item
      return checkItemsForResponsibility(signallingService, items, increment + 1);
    }

    async function checkIfWeShouldProcessTask(unprocessedItems: SynergyItem[], signallingService: SignallingService) {
      // Skip if not enough unprocessed items
      const enoughItems = unprocessedItems.length >= MIN_ITEMS_TO_PROCESS + PROCESSING_ITEMS_DELAY;
      if (!enoughItems) return false;

      // Skip if we didn't author any of the unprocessed items
      const weAuthoredAtLeastOne = unprocessedItems.some((item) => item.author === me.value.did);
      if (!weAuthoredAtLeastOne) return false;

      // Finally, walk through each item to see if we're the agent responsible for processing
      const responsibile = checkItemsForResponsibility(signallingService, unprocessedItems);
      return responsibile;
    }

    async function findProcessingTasksInCommunity(communityId: string) {
      const communityService = communityServiceStore.getCommunityService(communityId);
      if (!communityService) return;

      // Search conversations for processing tasks we are responsible for
      const tasks = await Promise.all(
        unref(communityService.recentConversations).map(async (conversationData) => {
          const unprocessedItems = await toRaw(conversationData.channel).unprocessedItems!();
          const shouldProcess = await checkIfWeShouldProcessTask(unprocessedItems, communityService.signallingService);
          return shouldProcess ? { communityId, channel: conversationData.channel } : null;
        }),
      );

      addTasksToProcessingQueue(tasks.filter((task) => task !== null));
    }

    function addTasksToProcessingQueue(tasks: ProcessingQueueItem[]) {
      // Filter out tasks already in the queue
      const filteredTasks = tasks.filter(
        (task) =>
          !processingQueue.value.some(
            (t) =>
              t.communityId === task.communityId &&
              toRaw(t.channel).baseExpression === toRaw(task.channel).baseExpression,
          ),
      );

      processingQueue.value.push(...filteredTasks);
      processesNextTask();
    }

    async function processesNextTask() {
      // Skip if already processing or the queue is empty
      if (processing.value || !processingQueue.value.length) return;

      // Mark processing true to prevent concurrent processing
      processing.value = true;

      console.log('🤖 LLM processing started');

      let communityService: CommunityService | undefined = undefined;

      try {
        // Prioritise tasks from the current channel, then the current community, and finally by their original order
        processingQueue.value = processingQueue.value
          .map((item, index) => ({ ...item, originalIndex: index }))
          .sort((a, b) => {
            const { channelId, communityId } = currentRoute.value;
            // Current channel gets highest priority
            if (a.channel.baseExpression === channelId && b.channel.baseExpression !== channelId) return -1;
            if (b.channel.baseExpression === channelId && a.channel.baseExpression !== channelId) return 1;

            // Current community gets second priority
            if (a.communityId === communityId && b.communityId !== communityId) return -1;
            if (b.communityId === communityId && a.communityId !== communityId) return 1;

            // If same priority level, maintain original insertion order
            return a.originalIndex - b.originalIndex;
          });

        // Get the first task from the queue & its associated communityService
        const { communityId, channel } = processingQueue.value[0];
        const rawChannel = toRaw(channel) as Channel;
        communityService = communityServiceStore.getCommunityService(communityId);
        const conversation = communityService?.getConversation(rawChannel.baseExpression!);
        const parentChannel = communityService?.getParentChannel(rawChannel.baseExpression!);

        if (!communityService || !conversation) {
          console.error('Missing community service or conversation');
          processingQueue.value.shift();
          return;
        }

        // Get the items to process from the channel
        const unprocessedItems = await rawChannel.unprocessedItems!();
        const numberOfItemsToProcess = Math.min(MAX_ITEMS_TO_PROCESS, unprocessedItems.length - PROCESSING_ITEMS_DELAY);
        const itemsToProcess = unprocessedItems.slice(0, numberOfItemsToProcess);

        // Create setProcessingState function to update processing state at each step
        function setProcessingState(newState: Partial<ProcessingState> | null) {
          // Update our app level processing state
          processingState.value = newState ? { ...processingState.value, ...newState } : null;

          // Update our processing state in the assosiated signalling service
          communityService!.signallingService.setProcessingState(newState);
        }

        // Set our initial processing state
        const itemIds = itemsToProcess.map((item) => item.baseExpression);
        setProcessingState({
          step: 1,
          channelId: rawChannel.baseExpression,
          author: me.value.did,
          itemIds,
          communityName: communityService.perspective.name,
          channelName: parentChannel?.name,
          conversationName: conversation.conversationName,
        });

        // Run the LLM processing
        await toRaw(conversation).processNewExpressions!(itemsToProcess, setProcessingState);

        // Remove the processed task from the queue
        processingQueue.value.shift();

        console.log('🤖 LLM processing completed', processingQueue.value);
      } catch (error) {
        console.error('🤖 LLM processing failed:', error);
        // Remove the failed task from the queue to prevent getting stuck
        processingQueue.value.shift();
      } finally {
        // Reset our processing state
        processingState.value = null;
        if (communityService) communityService.signallingService.setProcessingState(null);
        processing.value = false;

        // If there are more tasks in the queue, process the next one
        setTimeout(() => processesNextTask(), 0);
      }
    }

    // LLM status polling: refresh llmLoadingStatus until it becomes Ready when a defaultLLM is set
    const llmStatusInterval = ref<ReturnType<typeof setInterval> | null>(null);

    function stopLlmStatusPolling() {
      if (llmStatusInterval.value) {
        clearInterval(llmStatusInterval.value);
        llmStatusInterval.value = null;
      }
    }

    async function refreshLlmStatus() {
      try {
        const id = defaultLLM.value?.id;
        if (!id) return;
        const status = await ad4mClient.value.ai.modelLoadingStatus(id);
        llmLoadingStatus.value = status;
        if (status?.status?.toLowerCase() === 'ready') stopLlmStatusPolling();
      } catch (err) {
        // Keep UI stable; log and continue polling on next tick
        console.warn('LLM status poll failed:', err);
      }
    }

    function startLlmStatusPolling() {
      stopLlmStatusPolling();
      if (!defaultLLM.value?.id) return;
      // Kick off an immediate refresh, then poll
      refreshLlmStatus();
      llmStatusInterval.value = setInterval(refreshLlmStatus, 2000);
    }

    // Start/stop polling when the default model changes
    watch(defaultLLM, (model) => {
      if (model?.id) startLlmStatusPolling();
      else stopLlmStatusPolling();
    });

    // Stop polling once enabled
    watch(aiEnabled, (enabled) => {
      if (enabled) stopLlmStatusPolling();
    });

    // Cleanup on store teardown
    onUnmounted(() => stopLlmStatusPolling());

    // Load AI data when the ad4mClient is initialized
    watch(
      ad4mClient,
      (newClient) => {
        if (newClient) loadAIData();
      },
      { immediate: true },
    );

    // Watch for route changes & reload AI data when navigating to a new conversation
    watch(
      currentRoute,
      (newRoute, oldRoute) => {
        const isNewRoute =
          newRoute.communityId !== oldRoute?.communityId ||
          newRoute.channelId !== oldRoute?.channelId ||
          newRoute.viewId !== oldRoute?.viewId;
        if (isNewRoute && newRoute.viewId === 'conversation') loadAIData();
      },
      { immediate: true },
    );

    return {
      loadingAIData,
      processingQueue,
      processingState,
      allModels,
      allTasks,
      defaultLLM,
      llmLoadingStatus,
      whisperLoadingStatus,
      whisperTinyLoadingStatus,
      transcriptionEnabled,
      transcriptionModel,
      transcriptionPreviewTimeout,
      transcriptionMessageTimeout,
      transcriptionMaxChars,
      aiEnabled,
      setTranscriptionEnabled,
      toggleTranscriptionEnabled,
      setTranscriptionModel,
      setTranscriptionPreviewTimeout,
      setTranscriptionMessageTimeout,
      loadAIData,
      findProcessingTasksInCommunity,
      addTasksToProcessingQueue,
      checkIfWeShouldProcessTask,
    };
  },
  { persist: { omit: ['processingQueue', 'processingState'] } },
);
