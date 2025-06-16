import { defineStore } from "pinia";
import { ref } from "vue";

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
    const aiEnabled = ref(false);
    const transcriptionEnabled = ref(true);
    const transcriptionModel = ref("Base");
    const transcriptionPreviewTimeout = ref(0.4);
    const transcriptionMessageTimeout = ref(5);

    function setAIEnabled(payload: boolean): void {
      aiEnabled.value = payload;
    }

    function toggleAIEnabled(): void {
      aiEnabled.value = !aiEnabled.value;
    }

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

    return {
      aiEnabled,
      transcriptionEnabled,
      transcriptionModel,
      transcriptionPreviewTimeout,
      transcriptionMessageTimeout,
      setAIEnabled,
      toggleAIEnabled,
      setTranscriptionEnabled,
      toggleTranscriptionEnabled,
      setTranscriptionModel,
      setTranscriptionPreviewTimeout,
      setTranscriptionMessageTimeout,
    };
  },
  { persist: true }
);
