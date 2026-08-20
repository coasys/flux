// import { videoDimensions } from "@coasys/flux-constants/src/videoSettings";
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAppStore } from './appStore';
// Note: iOS audio routing (AirPods/Bluetooth) is handled natively in AppDelegate.swift
// via AVAudioSession configuration. For desktop browsers, setSinkId provides output switching.

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
  'mediaDevices',
  () => {
    const appStore = useAppStore();

    // State
    const mediaPermissions = ref<MediaPermissions>(defaultMediaPermissions);
    const activeCameraId = ref<string | null>(null);
    const activeMicrophoneId = ref<string | null>(null);
    const activeAudioOutputId = ref<string | null>(null);
    const availableDevices = ref<MediaDeviceInfo[]>([]);
    const stream = ref<MediaStream | null>(null);
    const streamLoading = ref(false);
    const error = ref<Error | null>(null);
    const screenShareEnabled = ref(false);
    // Held in its own stream so the camera tile and the screenshare tile can
    // be rendered side-by-side. Peers receive this as a separate track via
    // `webrtcStore.addScreenShareTrack`.
    const screenShareStream = ref<MediaStream | null>(null);
    const audioEnabled = ref(true);
    const videoEnabled = ref(false);

    // Computed properties
    const cameras = computed(() => availableDevices.value.filter((device) => device.kind === 'videoinput'));
    const microphones = computed(() => availableDevices.value.filter((device) => device.kind === 'audioinput'));
    const audioOutputs = computed(() => availableDevices.value.filter((device) => device.kind === 'audiooutput'));
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
        console.error('Media permissions error:', err);

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
        const previousOutputIds = new Set(audioOutputs.value.map((d) => d.deviceId));
        availableDevices.value = await navigator.mediaDevices.enumerateDevices();

        // Set default devices if not already set
        if (cameras.value.length > 0 && !activeCameraId.value) {
          activeCameraId.value = cameras.value[0].deviceId;
        }

        if (microphones.value.length > 0 && !activeMicrophoneId.value) {
          activeMicrophoneId.value = microphones.value[0].deviceId;
        }

        // Auto-switch to newly connected audio output (e.g. AirPods just connected)
        if (audioOutputs.value.length > 0) {
          if (!activeAudioOutputId.value) {
            activeAudioOutputId.value = audioOutputs.value[0].deviceId;
          } else {
            // Detect newly added output device and auto-switch to it
            const newOutput = audioOutputs.value.find((d) => !previousOutputIds.has(d.deviceId));
            if (newOutput) {
              console.log('🎧 New audio output detected, auto-switching to:', newOutput.label);
              switchAudioOutput(newOutput.deviceId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to get device list:', err);
      }
    }

    async function checkPermissions() {
      try {
        // If we have a stream with tracks, permissions are definitely granted
        if (stream.value) {
          const hasVideo = stream.value.getVideoTracks().length > 0;
          const hasAudio = stream.value.getAudioTracks().length > 0;

          if (hasVideo) {
            mediaPermissions.value.camera.granted = true;
          } else {
            // No video tracks - sync the enabled state
            mediaPermissions.value.camera.granted = false;
            if (videoEnabled.value && mediaPermissions.value.camera.requested) {
              console.log('Video tracks removed - syncing videoEnabled to false');
              videoEnabled.value = false;
            }
          }

          if (hasAudio) {
            mediaPermissions.value.microphone.granted = true;
          } else {
            // No audio tracks - sync the enabled state
            mediaPermissions.value.microphone.granted = false;
            if (audioEnabled.value && mediaPermissions.value.microphone.requested) {
              console.log('Audio tracks removed - syncing audioEnabled to false');
              audioEnabled.value = false;
            }
          }
        }

        // Try Permissions API as additional check
        if (navigator.permissions) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

            if (cameraPermission.state === 'granted') mediaPermissions.value.camera.granted = true;
            if (microphonePermission.state === 'granted') mediaPermissions.value.microphone.granted = true;

            // If permissions are denied, sync enabled states
            if (cameraPermission.state === 'denied' && videoEnabled.value && mediaPermissions.value.camera.requested) {
              console.log('Camera permission denied - syncing videoEnabled to false');
              videoEnabled.value = false;
            }
            if (
              microphonePermission.state === 'denied' &&
              audioEnabled.value &&
              mediaPermissions.value.microphone.requested
            ) {
              console.log('Microphone permission denied - syncing audioEnabled to false');
              audioEnabled.value = false;
            }
          } catch (err) {
            // Permissions API not supported
            console.log('Permissions API not available for camera/microphone');
          }
        }

        // Fallback to checking device labels
        if (!mediaPermissions.value.camera.granted || !mediaPermissions.value.microphone.granted) {
          await findAvailableDevices();
          const cameras = availableDevices.value.filter((d) => d.kind === 'videoinput');
          const mics = availableDevices.value.filter((d) => d.kind === 'audioinput');

          if (!mediaPermissions.value.camera.granted) {
            mediaPermissions.value.camera.granted = cameras.some((d) => !!d.label);
          }
          if (!mediaPermissions.value.microphone.granted) {
            mediaPermissions.value.microphone.granted = mics.some((d) => !!d.label);
          }
        }
      } catch (error) {
        console.error('Error checking media permissions:', error);
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
        const { useWebrtcStore } = await import('./webrtcStore');
        const webrtcStore = useWebrtcStore();
        await webrtcStore.replaceVideoTrack(newVideoTrack, oldVideoTrack);

        console.log('✅ Successfully switched camera');
      } catch (error) {
        console.error('❌ Failed to switch camera:', error);
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
        const { useWebrtcStore } = await import('./webrtcStore');
        const webrtcStore = useWebrtcStore();
        await webrtcStore.replaceAudioTrack(newAudioTrack, oldAudioTrack);

        console.log('✅ Successfully switched microphone');
      } catch (error) {
        console.error('❌ Failed to switch microphone:', error);
        activeMicrophoneId.value = previousId;
      }
    }

    // Switch audio output device (Chrome/Firefox only — setSinkId not available in Safari/iOS WebKit)
    // On iOS, audio routing is handled natively via AVAudioSession in AppDelegate.swift
    async function switchAudioOutput(deviceId: string) {
      activeAudioOutputId.value = deviceId;

      // setSinkId is only available in Chrome/Firefox, not Safari
      // On iOS native app, AVAudioSession handles routing automatically
      if (typeof HTMLMediaElement.prototype.setSinkId === 'undefined') {
        console.log('ℹ️ setSinkId not supported — audio routing handled by OS');
        return;
      }

      // Apply to all video/audio elements playing remote streams
      try {
        const mediaElements = document.querySelectorAll('video, audio');
        for (const element of mediaElements) {
          if ((element as any).setSinkId) {
            await (element as any).setSinkId(deviceId);
          }
        }
        console.log('✅ Switched audio output to:', deviceId);
      } catch (error) {
        console.error('❌ Failed to switch audio output:', error);
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
        if (screenShareStream.value) {
          screenShareStream.value.getTracks().forEach((t) => t.stop());
          screenShareStream.value = null;
        }
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
            const { useWebrtcStore } = await import('./webrtcStore');
            const webrtcStore = useWebrtcStore();
            await webrtcStore.addTrack(newAudioTrack, stream.value);

            console.log('✅ Added new audio track');
          } catch (error) {
            console.error('❌ Failed to add audio track:', error);
            // Revert the state if it failed
            audioEnabled.value = false;
          }
        } else {
          // Just enable existing tracks
          existingAudioTracks.forEach((track) => (track.enabled = true));
          console.log('✅ Enabled existing audio tracks');
        }
      } else {
        // Disabling audio - just disable tracks (don't remove them)
        stream.value.getAudioTracks().forEach((track) => (track.enabled = false));
        console.log('✅ Disabled audio tracks');
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
          console.log('✅ Enabled existing video tracks');
        } else {
          // Need to add video track
          const deviceId = activeCameraId.value ? { ideal: activeCameraId.value } : undefined;
          const videoConstraints = { ...videoDimensions, deviceId };

          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
            const newVideoTrack = newStream.getVideoTracks()[0];

            // Camera + screenshare now coexist as separate streams, so the
            // newly enabled camera track always lands in the main stream and
            // is forwarded to peers immediately — no swap-on-screenshare-end
            // bookkeeping is required.
            stream.value.addTrack(newVideoTrack);

            const { useWebrtcStore } = await import('./webrtcStore');
            const webrtcStore = useWebrtcStore();
            await webrtcStore.addTrack(newVideoTrack, stream.value);

            console.log('✅ Added new video track');
          } catch (error) {
            console.error('❌ Failed to add video track:', error);

            appStore.showDangerToast({
              message: 'Unable to access camera. Please grant camera permissions in your browser.',
            });
            // Revert the state if it failed
            videoEnabled.value = false;
          }
        }
      } else {
        // Disabling video - disable tracks with animation delay.
        // The camera tracks are independent of screenshare now, so disabling
        // the camera while sharing only kills the camera tile without
        // affecting the screenshare track.
        await new Promise((resolve) => setTimeout(resolve, 300)); // Fade out animation
        existingVideoTracks.forEach((track) => (track.enabled = false));
        console.log('✅ Disabled video tracks');
      }
    }

    async function turnOnScreenShare() {
      if (!stream.value) return;

      try {
        // Get the screen share stream as its own MediaStream so peers can
        // receive it alongside (not in place of) the camera track. The
        // camera track stays in the existing `stream` ref and continues
        // sending — both the local user and remote peers see a separate
        // tile for camera and screenshare.
        const newScreenShareStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenShareTrack = newScreenShareStream.getVideoTracks()[0];
        if (!screenShareTrack) {
          // The browser handed us a stream without a video track — rare but
          // possible if the user immediately cancelled the picker. Bail
          // cleanly rather than wiring a phantom share.
          newScreenShareStream.getTracks().forEach((t) => t.stop());
          return;
        }

        screenShareEnabled.value = true;
        screenShareStream.value = newScreenShareStream;

        // Detect when the user stops sharing via the browser's native UI
        // (e.g. the "Stop sharing" bar) and tear the share down cleanly.
        screenShareTrack.onended = () => {
          if (!screenShareEnabled.value) return;
          turnOffScreenShare();
        };

        // Send the screenshare to all peers as its own track + stream so
        // the receiving side fires a fresh 'track' event with a distinct
        // stream id, rather than swapping the existing camera sender.
        const { useWebrtcStore } = await import('./webrtcStore');
        const webrtcStore = useWebrtcStore();
        await webrtcStore.addScreenShareTrack(screenShareTrack, newScreenShareStream);

        console.log('✅ Successfully started screen share');
      } catch (error) {
        console.error('❌ Error starting screen share:', error);
        screenShareEnabled.value = false;
        if (screenShareStream.value) {
          screenShareStream.value.getTracks().forEach((t) => t.stop());
          screenShareStream.value = null;
        }
      }
    }

    async function turnOffScreenShare() {
      try {
        const tracks = screenShareStream.value?.getTracks() ?? [];

        // Stop the OS-level capture before tearing down the peer senders so
        // the browser's "Stop sharing" indicator goes away immediately.
        tracks.forEach((t) => t.stop());

        // Remove every screenshare sender from each peer connection.  The
        // receiving side's 'track ended' handler will surface the stream
        // disappearing — no replace-back to the camera track is needed.
        if (tracks.length) {
          const { useWebrtcStore } = await import('./webrtcStore');
          const webrtcStore = useWebrtcStore();
          for (const t of tracks) {
            await webrtcStore.removeTrack(t);
          }
        }

        screenShareEnabled.value = false;
        screenShareStream.value = null;

        console.log('✅ Successfully stopped screen share');
      } catch (error) {
        console.error('❌ Error stopping screen share:', error);
      }
    }

    async function toggleScreenShare() {
      if (!stream.value) return;
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported in this browser');
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
    navigator.mediaDevices.addEventListener('devicechange', findAvailableDevices);
    window.addEventListener('beforeunload', () => {
      resetMediaDevices();
      navigator.mediaDevices.removeEventListener('devicechange', findAvailableDevices);
    });

    return {
      // State
      mediaPermissions,
      activeCameraId,
      activeMicrophoneId,
      activeAudioOutputId,
      availableDevices,
      stream,
      screenShareStream,
      streamLoading,
      error,
      screenShareEnabled,

      // Computed
      cameras,
      microphones,
      audioOutputs,
      mediaSettings,

      // Methods
      createStream,
      switchCamera,
      switchMicrophone,
      switchAudioOutput,
      resetMediaDevices,
      findAvailableDevices,
      toggleAudio,
      toggleVideo,
      toggleScreenShare,
    };
  },
  {
    persist: {
      omit: ['stream', 'error'],
    },
  },
);
