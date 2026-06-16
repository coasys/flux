import type { MediaPlayerWarning } from '@/components/media-player/MediaPlayer.vue';
import {
  useAppStore,
  useMediaDevicesStore,
  useUiStore,
  useWebrtcStore,
  VideoLayoutOption,
  type MediaState,
} from '@/stores';
import { deriveRemoteSessionTiles, type RemoteCallSession } from '@/utils/callSessions';
import { useTabCoordinator } from '@/composables/useTabCoordinator';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';

export type Participant = {
  isMe: boolean;
  did: string;
  // The session this tile belongs to. One agent can be in the call from several
  // sessions (tabs/devices); each session's video/screenshare is its own tile.
  sessionId: string;
  inCall: boolean;
  stream: MediaStream | undefined;
  streamReady: boolean;
  audioState: MediaState;
  videoState: MediaState;
  screenShareState: MediaState;
  warning: MediaPlayerWarning;
  // Distinguishes a camera tile from a screenshare tile so a single user
  // can be rendered as two participants when they're sharing their screen
  // alongside their webcam.
  streamKind: 'camera' | 'screenshare';
  // Audio dedupe: when one person is in the call from multiple sessions, only
  // one of their tiles plays audio so the others don't echo.
  muteAudio: boolean;
};

export function useVideoLayout() {
  const appStore = useAppStore();
  const mediaDeviceStore = useMediaDevicesStore();
  const uiStore = useUiStore();
  const webrtcStore = useWebrtcStore();

  const { me } = storeToRefs(appStore);
  const { stream, screenShareStream, mediaSettings, mediaPermissions } = storeToRefs(mediaDeviceStore);
  const { callWindowWidth, callWindowOpen, selectedVideoLayout, focusedVideoId, selfViewVisible } =
    storeToRefs(uiStore);
  const { inCall, peerConnections, disconnectedAgents } = storeToRefs(webrtcStore);

  const mySessionId = useTabCoordinator().tabId;

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

    const myParticipants: Participant[] = [];

    // Local camera tile.  Hidden when the user toggles self-view off so they
    // can focus on the other participants while still being in the call.
    if (selfViewVisible.value) {
      myParticipants.push({
        isMe: true,
        did: me.value.did,
        sessionId: mySessionId,
        inCall: inCall.value,
        stream: stream.value || undefined,
        streamReady: true,
        audioState: (audioEnabled ? 'on' : 'off') as MediaState,
        videoState: (videoEnabled ? 'on' : 'off') as MediaState,
        // Camera tile never shows the screenshare badge — when both are on
        // we emit a separate screenshare tile below.
        screenShareState: 'off' as MediaState,
        warning,
        streamKind: 'camera',
        muteAudio: false, // the local tile is always muted via `isMe`
      });
    }

    // Local screenshare tile.  Emitted as its own participant so the camera
    // and screenshare can be rendered side-by-side instead of one replacing
    // the other.  Always shown to the local user (even when self-view is
    // off) because hiding your own screenshare would make it impossible to
    // verify what you're broadcasting.
    if (screenShareEnabled && screenShareStream.value) {
      myParticipants.push({
        isMe: true,
        did: me.value.did,
        sessionId: mySessionId,
        inCall: inCall.value,
        stream: screenShareStream.value,
        streamReady: true,
        audioState: 'off' as MediaState,
        videoState: 'off' as MediaState,
        screenShareState: 'on' as MediaState,
        warning: '' as MediaPlayerWarning,
        streamKind: 'screenshare',
        muteAudio: false,
      });
    }

    // Remote peers are session-level (one peer connection per session). Derive
    // render tiles via the shared helper: every video / screenshare feed shows
    // separately, no-video sessions collapse to one avatar per person, and only
    // one tile per person carries audio.
    const remoteSessions: RemoteCallSession<MediaStream>[] = peers.value.map((peer) => ({
      did: peer.did,
      sessionId: peer.sessionId,
      streams: peer.streams ?? [],
      streamReady: peer.streamReady,
      audioState: peer.audioState,
      videoState: peer.videoState,
      screenShareState: peer.screenShareState,
    }));

    const otherAgents: Participant[] = deriveRemoteSessionTiles(remoteSessions).map((tile) => ({
      isMe: false,
      did: tile.did,
      sessionId: tile.sessionId,
      inCall: true,
      stream: tile.stream || undefined,
      streamReady: tile.streamReady,
      audioState: tile.audioState,
      videoState: tile.videoState,
      screenShareState: tile.screenShareState,
      warning: '' as MediaPlayerWarning,
      streamKind: tile.streamKind,
      muteAudio: tile.muteAudio,
    }));

    return [...myParticipants, ...otherAgents];
  });

  // A `did` can now map to several tiles — multiple sessions (tabs/devices),
  // each with a camera and/or screenshare tile — so the key is the composite
  // `did:sessionId:streamKind`. Plain DIDs from older state still match via
  // `matchesFocus`, falling through to the first tile for that user.
  function participantKey(p: Participant): string {
    return `${p.did}:${p.sessionId}:${p.streamKind}`;
  }

  function matchesFocus(p: Participant, focusedId: string): boolean {
    if (!focusedId) return false;
    return participantKey(p) === focusedId || p.did === focusedId;
  }

  const focusedParticipant = computed(() => {
    const focusedId = focusedVideoId.value || me.value.did;
    return allParticipants.value.find((p) => matchesFocus(p, focusedId)) || allParticipants.value[0];
  });

  const unfocusedParticipants = computed(() => {
    const focusedId = focusedVideoId.value || me.value.did;
    return allParticipants.value.filter((p) => !matchesFocus(p, focusedId));
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

  function focusOnVideo(key: string) {
    if (!inCall.value) return;
    // `key` is either a participant key (`did:streamKind`) or a bare DID
    // from older callers; both are honoured by `matchesFocus` above.
    uiStore.setFocusedVideoId(key);
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

  // Toggle off focused layout if the focused session disconnects.
  // `disconnectedAgents` holds session keys (`did::sessionId`); the focused id
  // is a participant key (`did:sessionId:streamKind`) or a bare DID, so match by
  // the focused tile's actual session.
  watch(
    disconnectedAgents,
    (disconnected) => {
      if (!focusedVideoId.value) return;
      const focused = focusedParticipant.value;
      const focusedDisconnected =
        disconnected.includes(focusedVideoId.value) ||
        (!!focused && disconnected.includes(`${focused.did}::${focused.sessionId}`));
      if (focusedDisconnected) closeFocusedVideoLayout();
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
    participantKey,
  };
}
