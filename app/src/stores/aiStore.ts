import { useAppStore, useRouteMemoryStore } from "@/stores";
import { AIModelLoadingStatus, AITask } from "@coasys/ad4m";
import { Model } from "@coasys/ad4m/lib/src/ai/AIResolver";
import { defineStore, storeToRefs } from "pinia";
import { ref, watch } from "vue";

export const transcriptionModels = [
  "Tiny", // The tiny model.
  "QuantizedTiny", // The tiny model quantized to run faster.
  "TinyEn", // The tiny model with only English support.
  "QuantizedTinyEn", // The tiny model with only English support quantized to run faster.
  "Base", // The base model.
  "BaseEn", // The base model with only English support.
  "Small", // The small model.
  "SmallEn", // The small model with only English support.
  "Medium", // The medium model.
  "MediumEn", // The medium model with only English support.
  "QuantizedDistilMediumEn", // The medium model with only English support quantized to run faster.
  "Large", // The large model.
  "LargeV2", // The large model v2.
  "DistilMediumEn", // The distil-medium english model.
  "DistilLargeV2", // The distil-large model.
  "DistilLargeV3", // The distil-large-v3 model.
  "QuantizedDistilLargeV3", // The quantized distil-large-v3 model.
];

export const useAiStore = defineStore(
  "aiStore",
  () => {
    const appStore = useAppStore();
    const routeMemoryStore = useRouteMemoryStore();

    const { ad4mClient } = storeToRefs(appStore);
    const { currentRoute } = storeToRefs(routeMemoryStore);

    const loadingAIData = ref(false);
    const allModels = ref<Model[]>([]);
    const allTasks = ref<AITask[]>([]);
    const defaultLLM = ref<Model | null>(null);
    const llmLoadingStatus = ref<AIModelLoadingStatus | null>(null);
    const whisperLoadingStatus = ref<AIModelLoadingStatus | null>(null);
    const whisperTinyLoadingStatus = ref<AIModelLoadingStatus | null>(null);
    const transcriptionEnabled = ref(true);
    const transcriptionModel = ref("Base");
    const transcriptionPreviewTimeout = ref(0.4);
    const transcriptionMessageTimeout = ref(3);
    const transcriptionMaxChars = ref(1000);

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
        defaultLLM.value = await ad4mClient.value.ai.getDefaultModel("LLM");

        // Get model statuses
        const llm = allModels.value.find((model) => model.modelType === "LLM");
        if (llm) llmLoadingStatus.value = await ad4mClient.value.ai.modelLoadingStatus(llm.id);

        const whisper = allModels.value.find((model) => model.name === "Whisper");
        if (whisper) whisperLoadingStatus.value = await ad4mClient.value.ai.modelLoadingStatus(whisper.id);

        const whisperTiny = allModels.value.find((model) => model.name === "Whisper tiny quantized");
        if (whisperTiny) whisperTinyLoadingStatus.value = await ad4mClient.value.ai.modelLoadingStatus(whisperTiny.id);

        loadingAIData.value = false;
      } catch (error) {
        console.error("Failed to load AI data:", error);
        loadingAIData.value = false;
      }
    }

    // Load AI data when the ad4mClient is initialized
    watch(
      ad4mClient,
      (newClient) => {
        if (newClient) loadAIData();
      },
      { immediate: true }
    );

    // Watch for route changes & reload AI data when navigating to the synergy view
    watch(
      currentRoute,
      (newRoute, oldRoute) => {
        const isNewRoute = JSON.stringify(newRoute) !== JSON.stringify(oldRoute);
        const enteringSynergyView = newRoute.viewId === "@coasys/flux-synergy-demo-view";
        if (isNewRoute && enteringSynergyView) loadAIData();
      },
      { immediate: true }
    );

    return {
      loadingAIData,
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
      setTranscriptionEnabled,
      toggleTranscriptionEnabled,
      setTranscriptionModel,
      setTranscriptionPreviewTimeout,
      setTranscriptionMessageTimeout,
      loadAIData,
    };
  },
  { persist: true }
);
