import { computed, onUnmounted, ref } from "vue";

interface MediaPermissionOptions {
  audio?: boolean;
  video?: boolean;
}

export function useMediaDevices() {
  // State
  const mediaPermissions = ref({
    camera: { granted: false, requested: false },
    microphone: { granted: false, requested: false },
  });
  const activeCameraId = ref<string | null>(null);
  const activeMicrophoneId = ref<string | null>(null);
  const availableDevices = ref<MediaDeviceInfo[]>([]);
  const stream = ref<MediaStream | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // Computed properties
  const cameras = computed(() => availableDevices.value.filter((device) => device.kind === "videoinput"));
  const microphones = computed(() => availableDevices.value.filter((device) => device.kind === "audioinput"));
  const hasActiveStream = computed(() => stream.value !== null);

  // Methods
  async function requestPermissions({ audio = true, video = true }: MediaPermissionOptions) {
    isLoading.value = true;
    error.value = null;

    try {
      const constraints = {
        audio: audio ? { deviceId: activeMicrophoneId.value ? { exact: activeMicrophoneId.value } : undefined } : false,
        video: video ? { deviceId: activeCameraId.value ? { exact: activeCameraId.value } : undefined } : false,
      };

      stream.value = await navigator.mediaDevices.getUserMedia(constraints);

      mediaPermissions.value.camera.requested = video;
      mediaPermissions.value.camera.granted = video && !!stream.value.getVideoTracks().length;

      mediaPermissions.value.microphone.requested = audio;
      mediaPermissions.value.microphone.granted = audio && !!stream.value.getAudioTracks().length;

      // Update available devices after permissions granted
      await refreshDeviceList();

      return stream.value;
    } catch (err) {
      error.value = err as Error;
      console.error("Media permissions error:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshDeviceList() {
    try {
      availableDevices.value = await navigator.mediaDevices.enumerateDevices();
    } catch (err) {
      console.error("Failed to get device list:", err);
    }
  }

  function selectCamera(deviceId: string) {
    activeCameraId.value = deviceId;
    if (stream.value && mediaPermissions.value.camera.granted) restartStream();
  }

  function selectMicrophone(deviceId: string) {
    activeMicrophoneId.value = deviceId;
    if (stream.value && mediaPermissions.value.microphone.granted) restartStream();
  }

  async function restartStream() {
    if (stream.value) {
      stopStream();
      await requestPermissions({
        audio: mediaPermissions.value.microphone.granted,
        video: mediaPermissions.value.camera.granted,
      });
    }
  }

  function stopStream() {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
      stream.value = null;
    }
  }

  // Device change listener
  navigator.mediaDevices.addEventListener("devicechange", refreshDeviceList);

  // Cleanup
  onUnmounted(() => {
    stopStream();
    navigator.mediaDevices.removeEventListener("devicechange", refreshDeviceList);
  });

  // Initial device list
  refreshDeviceList();

  return {
    // State
    mediaPermissions,
    activeCameraId,
    activeMicrophoneId,
    availableDevices,
    stream,
    isLoading,
    error,

    // Computed
    cameras,
    microphones,
    hasActiveStream,

    // Methods
    requestPermissions,
    selectCamera,
    selectMicrophone,
    stopStream,
    refreshDeviceList,
  };
}
