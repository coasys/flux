import type { MediaPlayerWarning } from '@/components/media-player/MediaPlayer.vue';
import {
  useAppStore,
  useMediaDevicesStore,
  useUiStore,
  useWebrtcStore,
  VideoLayoutOption,
  type MediaState,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';

export function useVideoLayout() {
  const appStore = useAppStore();
  const mediaDeviceStore = useMediaDevicesStore();
  const uiStore = useUiStore();
  const webrtcStore = useWebrtcStore();

  const { me } = storeToRefs(appStore);
  const { stream, mediaSettings, mediaPermissions } = storeToRefs(mediaDeviceStore);
  const { callWindowWidth, callWindowOpen, selectedVideoLayout, focusedVideoId } = storeToRefs(uiStore);
  const { inCall, peerConnections, disconnectedAgents } = storeToRefs(webrtcStore);

  const videoLayoutOptions: VideoLayoutOption[] = [
    { label: '16/9 aspect ratio', class: '16-by-9', icon: 'aspect-ratio' },
    { label: 'Flexible aspect ratio', class: 'flexible', icon: 'arrows-fullscreen' },
    { label: 'Focused', class: 'focused', icon: 'person-video2' },
  ];

  const peers = computed(() => Array.from(peerConnections.value.values()));

  const allParticipants = computed(() => {
    const { microphone, camera } = mediaPermissions.value;
    const { audioEnabled, videoEnabled, screenShareEnabled } = mediaSettings.value;

    let warning = '' as MediaPlayerWarning;
    if (microphone && microphone.requested && !microphone.granted) warning = 'mic-disabled';
    else if (videoEnabled && camera && camera.requested && !camera.granted) warning = 'camera-disabled';

    const myAgent = {
      isMe: true,
      did: me.value.did,
      inCall: inCall.value,
      stream: stream.value || undefined,
      streamReady: true,
      audioState: (audioEnabled ? 'on' : 'off') as MediaState,
      videoState: (videoEnabled ? 'on' : 'off') as MediaState,
      screenShareState: (screenShareEnabled ? 'on' : 'off') as MediaState,
      warning,
    };

    const otherAgents = peers.value.map((peer) => ({
      isMe: false,
      did: peer.did,
      inCall: true,
      stream: peer.streams?.[0] || undefined,
      streamReady: peer.streamReady,
      audioState: peer.audioState,
      videoState: peer.videoState,
      screenShareState: peer.screenShareState,
      warning: '' as MediaPlayerWarning,
    }));

    return [myAgent, ...otherAgents];
  });

  const focusedParticipant = computed(() => {
    const focusedId = focusedVideoId.value || me.value.did;
    return allParticipants.value.find((p) => p.did === focusedId) || allParticipants.value[0];
  });

  const unfocusedParticipants = computed(() => {
    const focusedId = focusedVideoId.value || me.value.did;
    return allParticipants.value.filter((p) => p.did !== focusedId);
  });

  const numberOfColumns = computed(() => {
    const userCount = peers.value.length + 1;
    if (userCount === 1 || callWindowWidth.value <= 600 || selectedVideoLayout.value.label === 'Focused') return 1;
    else if ((userCount > 1 && userCount < 5) || (callWindowWidth.value > 600 && callWindowWidth.value <= 1200))
      return 2;
    else if (userCount > 4 && userCount < 10) return 3;
    else if (userCount > 8 && userCount < 17) return 4;
    return 5;
  });

  function selectVideoLayout(layout: VideoLayoutOption) {
    uiStore.setVideoLayout(layout);
  }

  function focusOnVideo(did: string) {
    if (!inCall.value) return;
    uiStore.setFocusedVideoId(did);
    if (selectedVideoLayout.value.label !== 'Focused') {
      uiStore.setVideoLayout(videoLayoutOptions[2]);
    }
  }

  function closeFocusedVideoLayout() {
    uiStore.setVideoLayout(videoLayoutOptions[0]);
    uiStore.setFocusedVideoId('');
  }

  // Reset layout & focused video when the call window opens
  watch(callWindowOpen, (open) => {
    if (open) closeFocusedVideoLayout();
  });

  // Toggle off focused layout if the focused agent disconnects
  watch(
    disconnectedAgents,
    (disconnected) => {
      if (focusedVideoId.value && disconnected.includes(focusedVideoId.value)) {
        closeFocusedVideoLayout();
      }
    },
    { deep: true },
  );

  return {
    // State
    videoLayoutOptions,
    selectedVideoLayout,
    focusedVideoId,

    // Computed
    allParticipants,
    focusedParticipant,
    unfocusedParticipants,
    numberOfColumns,

    // Methods
    selectVideoLayout,
    focusOnVideo,
    closeFocusedVideoLayout,
  };
}
