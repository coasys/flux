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
    const streamLoading = ref(false);
    const error = ref<Error | null>(null);
    const screenshareActive = ref(false);
    const audioActive = ref(true);
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
    async function getStream() {
      const { camera, microphone } = mediaPermissions.value;

      streamLoading.value = true;
      error.value = null;

      try {
        // Generate the constraints
        const audioDeviceId = activeMicrophoneId.value ? { exact: activeMicrophoneId.value } : undefined;
        const videoDeviceId = activeCameraId.value ? { exact: activeCameraId.value } : undefined;
        const audioConstraints = audioActive.value ? { deviceId: audioDeviceId } : false;
        const videoConstraints = videoActive.value ? { ...videoDimensions, deviceId: videoDeviceId } : false;

        // Get the stream
        stream.value = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: videoConstraints });

        // Update requested states
        microphone.requested = microphone.requested || audioActive.value;
        camera.requested = camera.requested || videoActive.value;

        // Update available devices & permissions
        await findAvailableDevices();
        await checkPermissions();
      } catch (err) {
        console.error("Media permissions error:", err);

        // Update media permission and error states
        microphone.requested = microphone.requested || audioActive.value;
        camera.requested = camera.requested || videoActive.value;
        error.value = err as Error;

        throw err;
      } finally {
        streamLoading.value = false;
      }
    }

    async function findAvailableDevices() {
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

    async function checkPermissions() {
      try {
        if (navigator.permissions) {
          // Check camera and microphone permissions using the Permissions API
          const cameraPermission = await navigator.permissions.query({ name: "camera" as PermissionName });
          const microphonePermission = await navigator.permissions.query({ name: "microphone" as PermissionName });

          mediaPermissions.value.camera.granted = cameraPermission.state === "granted";
          mediaPermissions.value.microphone.granted = microphonePermission.state === "granted";
        } else {
          // Fallback to checking device labels
          const cameras = availableDevices.value.filter((d) => d.kind === "videoinput");
          const mics = availableDevices.value.filter((d) => d.kind === "audioinput");

          mediaPermissions.value.camera.granted = cameras.some((d) => !!d.label);
          mediaPermissions.value.microphone.granted = mics.some((d) => !!d.label);
        }
      } catch (error) {
        console.error("Error checking media permissions:", error);
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
        await getStream();
      }
    }

    function stopTracks() {
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
        stream.value = null;
      }
    }

    function toggleAudio() {
      audioActive.value = !audioActive.value;

      // Request a new stream if toggling audio on and no stream or no audio tracks found
      const needsNewStream = audioActive.value && (!stream.value || !stream.value.getAudioTracks().length);
      if (needsNewStream) getStream();
      else {
        // Otherwise just toggle the tracks
        const tracks = stream.value?.getAudioTracks() || [];
        tracks.forEach((track) => (track.enabled = audioActive.value));
      }
    }

    function toggleVideo() {
      videoActive.value = !videoActive.value;

      // Request a new stream if toggling video on and no stream or no video tracks found
      const needsNewStream = videoActive.value && (!stream.value || !stream.value.getVideoTracks().length);
      if (needsNewStream) getStream();
      else {
        // Otherwise just toggle the video tracks
        const tracks = stream.value?.getVideoTracks() || [];
        tracks.forEach((track) => (track.enabled = videoActive.value));
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

    // Get initial device list
    findAvailableDevices();

    // Check permissions
    checkPermissions();

    // Set up device change listener
    navigator.mediaDevices.addEventListener("devicechange", findAvailableDevices);
    window.addEventListener("beforeunload", () => {
      stopTracks();
      navigator.mediaDevices.removeEventListener("devicechange", findAvailableDevices);
    });

    return {
      // State
      mediaPermissions,
      activeCameraId,
      activeMicrophoneId,
      availableDevices,
      stream,
      streamLoading,
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
      findAvailableDevices,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      restartStream,
    };
  },
  { persist: true } // { pick: ['', ''] }
);
