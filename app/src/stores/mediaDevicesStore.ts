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

export const defaultMediaPermissions: MediaPermissions = {
  camera: { granted: false, requested: false },
  microphone: { granted: false, requested: false },
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
    const videoEnabled = ref(true);
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
        const audioDeviceId = activeMicrophoneId.value ? { ideal: activeMicrophoneId.value } : undefined;
        const videoDeviceId = activeCameraId.value ? { ideal: activeCameraId.value } : undefined;
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
    // If we have a stream with tracks, permissions are definitely granted
    if (stream.value) {
      const hasVideo = stream.value.getVideoTracks().length > 0;
      const hasAudio = stream.value.getAudioTracks().length > 0;
      
      if (hasVideo) mediaPermissions.value.camera.granted = true;
      if (hasAudio) mediaPermissions.value.microphone.granted = true;
    }

    // Try Permissions API as additional check
    if (navigator.permissions) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: "camera" as PermissionName });
        const microphonePermission = await navigator.permissions.query({ name: "microphone" as PermissionName });

        if (cameraPermission.state === "granted") mediaPermissions.value.camera.granted = true;
        if (microphonePermission.state === "granted") mediaPermissions.value.microphone.granted = true;
      } catch (err) {
        // Permissions API not supported
        console.log("Permissions API not available for camera/microphone");
      }
    }

    // Fallback to checking device labels
    if (!mediaPermissions.value.camera.granted || !mediaPermissions.value.microphone.granted) {
      await findAvailableDevices();
      const cameras = availableDevices.value.filter((d) => d.kind === "videoinput");
      const mics = availableDevices.value.filter((d) => d.kind === "audioinput");

      if (!mediaPermissions.value.camera.granted) {
        mediaPermissions.value.camera.granted = cameras.some((d) => !!d.label);
      }
      if (!mediaPermissions.value.microphone.granted) {
        mediaPermissions.value.microphone.granted = mics.some((d) => !!d.label);
      }
    }
  } catch (error) {
    console.error("Error checking media permissions:", error);
  }
}

    async function switchCamera(deviceId: string) {
      const previousId = activeCameraId.value;
      activeCameraId.value = deviceId;

      if (!stream.value || !mediaPermissions.value.camera.granted || previousId === deviceId) {
        return;
      }

      try {
        // Get new video track
        const videoConstraints = { ...videoDimensions, deviceId: { ideal: deviceId } };
        const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Get old video track
        const oldVideoTrack = stream.value.getVideoTracks()[0];

        // Update local stream
        if (oldVideoTrack) {
          stream.value.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        stream.value.addTrack(newVideoTrack);

        // Update peer connections (lazy import to avoid circular dependency)
        const { useWebrtcStore } = await import("./webrtcStore");
        const webrtcStore = useWebrtcStore();
        await webrtcStore.replaceVideoTrack(newVideoTrack, oldVideoTrack);

        console.log("✅ Successfully switched camera");
      } catch (error) {
        console.error("❌ Failed to switch camera:", error);
        activeCameraId.value = previousId;
      }
    }

    async function switchMicrophone(deviceId: string) {
      const previousId = activeMicrophoneId.value;
      activeMicrophoneId.value = deviceId;

      if (!stream.value || !mediaPermissions.value.microphone.granted || previousId === deviceId) return;

      try {
        // Get new audio track
        const audioConstraints = { deviceId: { ideal: deviceId } };
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        const newAudioTrack = newStream.getAudioTracks()[0];

        // Get old audio track
        const oldAudioTrack = stream.value.getAudioTracks()[0];

        // Update local stream
        if (oldAudioTrack) {
          stream.value.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        stream.value.addTrack(newAudioTrack);

        // Update peer connections
        const { useWebrtcStore } = await import("./webrtcStore");
        const webrtcStore = useWebrtcStore();
        await webrtcStore.replaceAudioTrack(newAudioTrack, oldAudioTrack);

        console.log("✅ Successfully switched microphone");
      } catch (error) {
        console.error("❌ Failed to switch microphone:", error);
        activeMicrophoneId.value = previousId;
      }
    }

    function resetMediaDevices() {
      if (!stream.value) return;

      // Stop all tracks
      stream.value.getTracks().forEach((track) => track.stop());

      // Reset state
      stream.value = null;

      // Re-enable audio if off to avoid error starting a stream without any media
      if (!audioEnabled.value) audioEnabled.value = true;

      // Reset screen share state
      if (screenShareEnabled.value) {
        screenShareEnabled.value = false;
        savedVideoTrack = null;
      }
    }

    async function toggleAudio() {
      if (!stream.value) return;

      audioEnabled.value = !audioEnabled.value;

      if (audioEnabled.value) {
        // Enabling audio
        const existingAudioTracks = stream.value.getAudioTracks();

        if (existingAudioTracks.length === 0) {
          // Need to add audio track
          const audioConstraints = {
            deviceId: activeMicrophoneId.value ? { ideal: activeMicrophoneId.value } : undefined,
          };

          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
            const newAudioTrack = newStream.getAudioTracks()[0];

            stream.value.addTrack(newAudioTrack);

            // Update peer connections
            const { useWebrtcStore } = await import("./webrtcStore");
            const webrtcStore = useWebrtcStore();
            await webrtcStore.addTrack(newAudioTrack, stream.value);

            console.log("✅ Added new audio track");
          } catch (error) {
            console.error("❌ Failed to add audio track:", error);
            // Revert the state if it failed
            audioEnabled.value = false;
          }
        } else {
          // Just enable existing tracks
          existingAudioTracks.forEach((track) => (track.enabled = true));
          console.log("✅ Enabled existing audio tracks");
        }
      } else {
        // Disabling audio - just disable tracks (don't remove them)
        stream.value.getAudioTracks().forEach((track) => (track.enabled = false));
        console.log("✅ Disabled audio tracks");
      }
    }

    async function toggleVideo() {
      if (!stream.value) return;

      videoEnabled.value = !videoEnabled.value;

      const existingVideoTracks = stream.value.getVideoTracks();

      if (videoEnabled.value) {
        // Enabling video
        if (existingVideoTracks.length) {
          // Enable existing tracks
          existingVideoTracks.forEach((track) => (track.enabled = true));
          console.log("✅ Enabled existing video tracks");
        } else {
          // Need to add video track
          const deviceId = activeCameraId.value ? { ideal: activeCameraId.value } : undefined;
          const videoConstraints = { ...videoDimensions, deviceId };

          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
            const newVideoTrack = newStream.getVideoTracks()[0];

            // If screen sharing is enabled, save the new track for later restoration
            if (screenShareEnabled.value) savedVideoTrack = newVideoTrack;
            else {
              // Otherwise, add the new track directly to the stream
              stream.value.addTrack(newVideoTrack);

              // Update peer connections
              const { useWebrtcStore } = await import("./webrtcStore");
              const webrtcStore = useWebrtcStore();
              await webrtcStore.addTrack(newVideoTrack, stream.value);
            }

            console.log("✅ Added new video track");
          } catch (error) {
            console.error("❌ Failed to add video track:", error);
            // Revert the state if it failed
            videoEnabled.value = false;
          }
        }
      } else if (!screenShareEnabled.value) {
        // Disabling video - disable tracks with animation delay
        await new Promise((resolve) => setTimeout(resolve, 300)); // Fade out animation
        existingVideoTracks.forEach((track) => (track.enabled = false));
        console.log("✅ Disabled video tracks");
      }
    }

    async function turnOnScreenShare() {
      if (!stream.value) return;

      try {
        // Get the screen share track
        const screenShareStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenShareTrack = screenShareStream.getVideoTracks()[0];

        // Update my media settings
        screenShareEnabled.value = true;

        // Add onended handler to detect when the user stops sharing via browser UI
        screenShareTrack.onended = () => {
          if (!screenShareEnabled.value) return;
          screenShareEnabled.value = false;
          turnOffScreenShare();
        };

        // Get existing video track if present
        const existingVideoTrack = stream.value.getVideoTracks()[0];

        // Save existing video track for later restoration
        if (existingVideoTrack) {
          savedVideoTrack = existingVideoTrack;
          // Remove existing video track from stream
          stream.value.removeTrack(existingVideoTrack);
        }

        // Add screen share track to existing stream
        stream.value.addTrack(screenShareTrack);

        // Update peer connections
        const { useWebrtcStore } = await import("./webrtcStore");
        const webrtcStore = useWebrtcStore();
        await webrtcStore.replaceVideoTrack(screenShareTrack, existingVideoTrack);

        console.log("✅ Successfully started screen share");
      } catch (error) {
        console.error("❌ Error starting screen share:", error);
        screenShareEnabled.value = false;
      }
    }

    async function turnOffScreenShare() {
      if (!stream.value) return;

      try {
        // Get current screen share track
        const screenShareTrack = stream.value.getVideoTracks()[0];

        // Remove screen share track from stream
        if (screenShareTrack) {
          stream.value.removeTrack(screenShareTrack);
          screenShareTrack.stop();
        }

        // Update media settings
        screenShareEnabled.value = false;

        // Restore saved video track if it exists
        if (savedVideoTrack) {
          // Re-enable the saved track if video should be enabled
          savedVideoTrack.enabled = videoEnabled.value;
          stream.value.addTrack(savedVideoTrack);

          // Update peer connections
          const { useWebrtcStore } = await import("./webrtcStore");
          const webrtcStore = useWebrtcStore();
          await webrtcStore.replaceVideoTrack(savedVideoTrack, screenShareTrack);

          savedVideoTrack = null; // Clear the saved track
        } else {
          // No saved track - just remove screen share from peers
          const { useWebrtcStore } = await import("./webrtcStore");
          const webrtcStore = useWebrtcStore();
          await webrtcStore.removeTrack(screenShareTrack);
        }

        console.log("✅ Successfully stopped screen share");
      } catch (error) {
        console.error("❌ Error stopping screen share:", error);
      }
    }

    async function toggleScreenShare() {
      if (!stream.value) return;
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing not supported in this browser");
      }

      // Handle stream updates
      if (!screenShareEnabled.value) await turnOnScreenShare();
      else await turnOffScreenShare();
    }

    // Get initial device list
    findAvailableDevices();

    // Check permissions
    checkPermissions();

    // Set up device change listener
    navigator.mediaDevices.addEventListener("devicechange", findAvailableDevices);
    window.addEventListener("beforeunload", () => {
      resetMediaDevices();
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
      screenShareEnabled,

      // Computed
      cameras,
      microphones,
      mediaSettings,

      // Methods
      createStream,
      switchCamera,
      switchMicrophone,
      resetMediaDevices,
      findAvailableDevices,
      toggleAudio,
      toggleVideo,
      toggleScreenShare,
    };
  },
  { persist: true }
);
