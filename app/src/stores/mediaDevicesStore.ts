import { videoDimensions } from "@coasys/flux-constants/src/videoSettings";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

interface MediaPermissionOptions {
  audio?: boolean;
  video?: boolean;
}

export const useMediaDevicesStore = defineStore(
  "mediaDevices",
  () => {
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
    const screenshareActive = ref(false);

    // Computed properties
    const cameras = computed(() => availableDevices.value.filter((device) => device.kind === "videoinput"));
    const microphones = computed(() => availableDevices.value.filter((device) => device.kind === "audioinput"));
    const hasActiveStream = computed(() => stream.value !== null);
    const audioEnabled = computed(() => {
      if (!stream.value) return false;
      const audioTracks = stream.value.getAudioTracks();
      return audioTracks.length > 0 && audioTracks.some((track) => track.enabled);
    });
    const videoEnabled = computed(() => {
      if (!stream.value) return false;
      const videoTracks = stream.value.getVideoTracks();
      return videoTracks.length > 0 && videoTracks.some((track) => track.enabled);
    });
    const mediaSettings = computed(() => ({
      audio: audioEnabled.value,
      video: videoEnabled.value,
      screenshare: screenshareActive.value,
    }));

    // Methods
    async function requestPermissions({ audio = true, video = true }: MediaPermissionOptions) {
      isLoading.value = true;
      error.value = null;

      try {
        const constraints = {
          audio: audio
            ? { deviceId: activeMicrophoneId.value ? { exact: activeMicrophoneId.value } : undefined }
            : false,
          video: video
            ? { ...videoDimensions, deviceId: activeCameraId.value ? { exact: activeCameraId.value } : undefined }
            : false,
        };

        stream.value = await navigator.mediaDevices.getUserMedia(constraints);

        const { camera, microphone } = mediaPermissions.value;
        camera.requested = video;
        camera.granted = video && !!stream.value.getVideoTracks().length;

        microphone.requested = audio;
        microphone.granted = audio && !!stream.value.getAudioTracks().length;

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

        // Set default devices if not already set
        if (cameras.value.length > 0 && !activeCameraId.value) {
          activeCameraId.value = cameras.value[0].deviceId;
        }

        if (microphones.value.length > 0 && !activeMicrophoneId.value) {
          activeMicrophoneId.value = microphones.value[0].deviceId;
        }
      } catch (err) {
        console.error("Failed to get device list:", err);
      }
    }

    function switchCamera(deviceId: string) {
      const previousId = activeCameraId.value;
      activeCameraId.value = deviceId;

      if (stream.value && mediaPermissions.value.camera.granted && previousId !== deviceId) {
        restartStream();
      }
    }

    function switchMicrophone(deviceId: string) {
      const previousId = activeMicrophoneId.value;
      activeMicrophoneId.value = deviceId;

      if (stream.value && mediaPermissions.value.microphone.granted && previousId !== deviceId) {
        restartStream();
      }
    }

    async function restartStream() {
      if (stream.value) {
        stopTracks();
        await requestPermissions({
          audio: mediaPermissions.value.microphone.granted,
          video: mediaPermissions.value.camera.granted,
        });
      }
    }

    function stopTracks() {
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
        stream.value = null;
      }
    }

    function toggleTrack(kind: "audio" | "video", enabled: boolean) {
      if (!stream.value) return;

      const tracks = kind === "audio" ? stream.value.getAudioTracks() : stream.value.getVideoTracks();

      tracks.forEach((track) => (track.enabled = enabled));
    }

    function toggleAudio() {
      console.log("mediaPermissions", mediaPermissions.value);
      if (mediaPermissions.value.microphone.granted || audioEnabled.value) {
        // If we already have permission or we're disabling, just toggle
        toggleTrack("audio", !audioEnabled.value);
      } else {
        // If we're enabling and don't have permission, request it
        requestPermissions({ audio: true, video: videoEnabled.value });
      }
    }

    function toggleVideo() {
      console.log("mediaPermissions", mediaPermissions.value, stream.value);

      // Request permission if not yet granted
      if (!stream.value) requestPermissions({ video: true, audio: audioEnabled.value });
      // if (!mediaPermissions.value.camera.granted) requestPermissions({ video: true, audio: audioEnabled.value });

      // If disabling video toggle the track off
      if (videoEnabled.value) toggleTrack("video", false);

      // if (mediaPermissions.value.camera.granted || videoEnabled.value) {
      //   // If we already have permission or we're disabling, just toggle the track
      //   toggleTrack("video", !videoEnabled.value);
      // } else {
      //   // If we're enabling and don't have permission, request it
      //   console.log("requesting video permission");
      //   requestPermissions({ video: true, audio: audioEnabled.value });
      // }
    }

    async function startScreenShare() {
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing not supported in this browser");
      }

      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenshareActive.value = true;

        // Handle screen share end event
        const videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => (screenshareActive.value = false);

        // If we already have a stream, we need to keep audio tracks
        if (stream.value) {
          // Stop existing video tracks
          stream.value.getVideoTracks().forEach((track) => track.stop());

          // Add screen share track to existing stream
          stream.value.addTrack(videoTrack);

          // Return the mixed stream
          return stream.value;
        } else {
          // Just return the screen stream if we don't have a stream yet
          stream.value = screenStream;
          return screenStream;
        }
      } catch (err) {
        console.error("Screen sharing error:", err);
        throw err;
      }
    }

    // Set up device change listener
    if (typeof window !== "undefined") {
      navigator.mediaDevices.addEventListener("devicechange", refreshDeviceList);

      // Cleanup on app unmount
      window.addEventListener("beforeunload", () => {
        stopTracks();
        navigator.mediaDevices.removeEventListener("devicechange", refreshDeviceList);
      });

      // Initial device list
      refreshDeviceList();
    }

    return {
      // State
      mediaPermissions,
      activeCameraId,
      activeMicrophoneId,
      availableDevices,
      stream,
      isLoading,
      error,
      screenshareActive,

      // Computed
      cameras,
      microphones,
      hasActiveStream,
      mediaSettings,

      // Methods
      requestPermissions,
      switchCamera,
      switchMicrophone,
      stopTracks,
      refreshDeviceList,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      restartStream,
    };
  }
  // {
  //   // Persistence options
  //   persist: {
  //     enabled: true,
  //     properties: ['activeCameraId', 'activeMicrophoneId']
  //   }
  // }
);
