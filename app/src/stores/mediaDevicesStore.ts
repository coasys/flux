// import { videoDimensions } from "@coasys/flux-constants/src/videoSettings";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// TODO: create return type for store?

const videoDimensions = {
  aspectRatio: 1.777, // 16:9
  width: { min: 640, ideal: 1280, max: 1920 },
  height: { min: 360, ideal: 720, max: 1080 },
  frameRate: { min: 5, ideal: 15, max: 20 },
};

export type MediaSettings = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
};

export type MediaPermissions = {
  camera: { granted: boolean; requested: boolean };
  microphone: { granted: boolean; requested: boolean };
};

export const defaultMediaPermissions: MediaPermissions = {
  camera: { granted: false, requested: false },
  microphone: { granted: false, requested: false },
};

export const useMediaDevicesStore = defineStore(
  "mediaDevices",
  () => {
    // State
    const mediaPermissions = ref<MediaPermissions>(defaultMediaPermissions);
    const activeCameraId = ref<string | null>(null);
    const activeMicrophoneId = ref<string | null>(null);
    const availableDevices = ref<MediaDeviceInfo[]>([]);
    const stream = ref<MediaStream | null>(null);
    const streamLoading = ref(false);
    const error = ref<Error | null>(null);
    const screenShareEnabled = ref(false);
    const audioEnabled = ref(true);
    const videoEnabled = ref(false);
    let savedVideoTrack: MediaStreamTrack | null = null;

    // Computed properties
    const cameras = computed(() => availableDevices.value.filter((device) => device.kind === "videoinput"));
    const microphones = computed(() => availableDevices.value.filter((device) => device.kind === "audioinput"));
    const mediaSettings = computed<MediaSettings>(() => ({
      audioEnabled: audioEnabled.value,
      videoEnabled: videoEnabled.value,
      screenShareEnabled: screenShareEnabled.value,
    }));

    // Methods
    async function createStream() {
      const { camera, microphone } = mediaPermissions.value;

      streamLoading.value = true;
      error.value = null;

      try {
        // Generate the constraints
        const audioDeviceId = activeMicrophoneId.value ? { exact: activeMicrophoneId.value } : undefined;
        const videoDeviceId = activeCameraId.value ? { exact: activeCameraId.value } : undefined;
        const audioConstraints = audioEnabled.value ? { deviceId: audioDeviceId } : false;
        const videoConstraints = videoEnabled.value ? { ...videoDimensions, deviceId: videoDeviceId } : false;

        // Create the stream
        stream.value = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: videoConstraints });

        // Update request states
        microphone.requested = microphone.requested || audioEnabled.value;
        camera.requested = camera.requested || videoEnabled.value;

        // Update available devices & permissions
        await findAvailableDevices();
        await checkPermissions();
      } catch (err) {
        console.error("Media permissions error:", err);

        // Update media permission and error states
        microphone.requested = microphone.requested || audioEnabled.value;
        camera.requested = camera.requested || videoEnabled.value;
        error.value = err as Error;

        throw err;
      } finally {
        streamLoading.value = false;
      }
    }

    async function restartStream() {
      if (!stream.value) return;
      stopTracks();
      await createStream();
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

      const newStreamRequired = stream.value && mediaPermissions.value.camera.granted && previousId !== deviceId;
      if (newStreamRequired) restartStream();
    }

    function switchMicrophone(deviceId: string) {
      const previousId = activeMicrophoneId.value;
      activeMicrophoneId.value = deviceId;

      const newStreamRequired = stream.value && mediaPermissions.value.microphone.granted && previousId !== deviceId;
      if (newStreamRequired) restartStream();
    }

    function stopTracks() {
      if (!stream.value) return;
      stream.value.getTracks().forEach((track) => track.stop());
      stream.value = null;
    }

    function toggleAudio() {
      if (!stream.value) return;

      audioEnabled.value = !audioEnabled.value;

      // Request a new stream if toggling audio on and no audio tracks found
      const needsNewStream = audioEnabled.value && !stream.value.getAudioTracks().length;
      if (needsNewStream) createStream();
      else {
        // Otherwise just toggle the tracks
        stream.value.getAudioTracks().forEach((track) => (track.enabled = audioEnabled.value));
      }
    }

    async function toggleVideo() {
      if (!stream.value) return;

      videoEnabled.value = !videoEnabled.value;

      // Skip if screen sharing is active
      if (screenShareEnabled.value) return;

      // Request a new stream if toggling video on and no video tracks found
      const needsNewStream = videoEnabled.value && !stream.value.getVideoTracks().length;
      if (needsNewStream) createStream();
      else {
        // If toggling video off, delay track removal until fade out animation completes
        if (!videoEnabled.value) await new Promise((resolve) => setTimeout(resolve, 300));

        // Toggle the video tracks
        stream.value.getVideoTracks().forEach((track) => (track.enabled = videoEnabled.value));
      }
    }

    async function turnOnScreenShare() {
      if (!stream.value) return;

      // Get the screen share track
      try {
        const screenShareStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenShareTrack = screenShareStream.getVideoTracks()[0];

        // Add onended handler to detect when the user stops sharing via browser UI
        screenShareTrack.onended = () => {
          if (!screenShareEnabled.value) return;
          screenShareEnabled.value = false;
          turnOffScreenShare();
        };

        // Save existing video track if present
        const existingVideoTrack = stream.value.getVideoTracks()[0];
        if (existingVideoTrack) {
          savedVideoTrack = existingVideoTrack;
          existingVideoTrack.enabled = false;
        }

        // Create a new stream
        const newStream = new MediaStream();

        // Transfer audio tracks to the new stream
        stream.value.getAudioTracks().forEach((track) => newStream.addTrack(track));

        // Add the new screen share track
        newStream.addTrack(screenShareTrack);

        // Replace stream
        stream.value = newStream;
      } catch (error) {
        console.error("Error starting screen share:", error);

        screenShareEnabled.value = false;
      }
    }

    async function turnOffScreenShare() {
      if (!stream.value) return;

      // Stop current video tracks
      stream.value.getVideoTracks().forEach((track) => track.stop());

      // Create new stream
      const newStream = new MediaStream();

      // Transfer audio tracks to the new stream
      stream.value.getAudioTracks().forEach((track) => newStream.addTrack(track));

      // Restore saved camera track if available
      if (savedVideoTrack) {
        savedVideoTrack.enabled = videoEnabled.value;
        newStream.addTrack(savedVideoTrack);
        savedVideoTrack = null;
      }

      // Replace the stream
      stream.value = newStream;
    }

    async function toggleScreenShare() {
      if (!stream.value) return;
      if (!navigator.mediaDevices.getDisplayMedia) throw new Error("Screen sharing not supported in this browser");

      // Update screen share state
      screenShareEnabled.value = !screenShareEnabled.value;

      // Handle stream updates
      if (screenShareEnabled.value) turnOnScreenShare();
      else turnOffScreenShare();
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
      createStream,
      switchCamera,
      switchMicrophone,
      stopTracks,
      findAvailableDevices,
      toggleAudio,
      toggleVideo,
      toggleScreenShare,
      restartStream,
    };
  },
  { persist: true } // { pick: ['', ''] }
);
