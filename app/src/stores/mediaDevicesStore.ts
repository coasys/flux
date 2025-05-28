import { videoDimensions } from "@coasys/flux-constants/src/videoSettings";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

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
    const audioActive = ref(false);
    const videoActive = ref(false);

    // Computed properties
    const cameras = computed(() => availableDevices.value.filter((device) => device.kind === "videoinput"));
    const microphones = computed(() => availableDevices.value.filter((device) => device.kind === "audioinput"));
    const mediaSettings = computed(() => ({
      audio: audioActive.value,
      video: videoActive.value,
      screenshare: screenshareActive.value,
    }));

    // Methods
    async function getStream({ audio = true, video = true }: { audio?: boolean; video?: boolean }) {
      isLoading.value = true;
      error.value = null;

      try {
        // Generate the constraints
        const audioDeviceId = activeMicrophoneId.value ? { exact: activeMicrophoneId.value } : undefined;
        const videoDeviceId = activeCameraId.value ? { exact: activeCameraId.value } : undefined;
        const audioConstraints = audio ? { deviceId: audioDeviceId } : false;
        const videoConstraints = video ? { ...videoDimensions, deviceId: videoDeviceId } : false;

        // Get the stream
        stream.value = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: videoConstraints });

        // Update active states
        audioActive.value = audio && !!stream.value.getAudioTracks().length;
        videoActive.value = video && !!stream.value.getVideoTracks().length;

        // Update media permissions
        const { camera, microphone } = mediaPermissions.value;
        microphone.requested = audio;
        microphone.granted = audioActive.value;
        camera.requested = video;
        camera.granted = videoActive.value;

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
        await getStream({
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

    function toggleAudio() {
      // Request a stream if it doesn't exist
      if (!stream.value) getStream({ audio: true, video: videoActive.value });
      else {
        // Otherwise just toggle the audio tracks
        const tracks = stream.value.getAudioTracks();
        tracks.forEach((track) => (track.enabled = !audioActive.value));
        audioActive.value = !audioActive.value;
      }
    }

    function toggleVideo() {
      // Request a stream if it doesn't exist
      if (!stream.value) getStream({ video: true, audio: audioActive.value });
      else {
        // Otherwise just toggle the video tracks
        const tracks = stream.value.getVideoTracks();
        tracks.forEach((track) => (track.enabled = !videoActive.value));
        videoActive.value = !videoActive.value;
      }
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

      // Computed
      cameras,
      microphones,
      mediaSettings,

      // Methods
      getStream,
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
