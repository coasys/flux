import { Agent, PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { videoSettings } from "@coasys/flux-constants";
import { getDefaultIceServers, getForVersion, setForVersion, throttle } from "@coasys/flux-utils";
import { Connection, Event, EventLogItem, IceServer, Settings, WebRTCManager } from "@coasys/flux-webrtc";
import { computed, onUnmounted, ref, Ref, watch } from "vue";
import { useMediaDevices } from "./useMediaDevices";

const version = "v1";
const { defaultSettings, videoDimensions } = videoSettings;

export type Peer = {
  did: string;
  connection: Connection;
  state: { settings: Settings; [key: string]: any };
};

export type Reaction = {
  did: string;
  reaction: string;
};

type Props = {
  enabled: boolean;
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
  defaultState?: Peer["state"];
  events?: { onPeerJoin?: (uuid: string) => void; onPeerLeave?: (uuid: string) => void };
};

type JoinProps = {
  initialState?: Peer["state"];
};

export type WebRTC = {
  localStream: Ref<MediaStream | null>;
  localState: Ref<Peer["state"]>;
  connections: Ref<Peer[]>;
  devices: Ref<MediaDeviceInfo[]>;
  iceServers: Ref<IceServer[]>;
  reactions: Ref<Reaction[]>;
  localEventLog: Ref<EventLogItem[]>;
  isInitialised: Ref<boolean>;
  hasJoined: Ref<boolean>;
  isLoading: Ref<boolean>;
  audioPermissionGranted: Ref<boolean>;
  videoPermissionGranted: Ref<boolean>;
  onJoin: (props: JoinProps) => Promise<void>;
  onLeave: () => Promise<void>;
  onReaction: (reaction: string) => Promise<void>;
  onToggleCamera: (enabled: boolean) => void;
  onChangeCamera: (deviceId: string) => void;
  onToggleAudio: (enabled: boolean) => void;
  onChangeAudio: (deviceId: string) => void;
  onToggleScreenShare: (enabled: boolean) => void;
  onChangeState: (newState: Peer["state"]) => void;
  onChangeIceServers: (servers: IceServer[]) => void;
  updateTranscriptionSetting: (setting: string, value: any) => void;
};

export function useWebRTCService({ enabled, source, perspective, agent: agentClient, events }: Props): WebRTC {
  // Use media devices composable for better device management
  const mediaDevices = useMediaDevices();

  // WebRTC specific state
  const manager = ref<WebRTCManager | null>(null);
  const localState = ref<Peer["state"]>({ settings: defaultSettings });
  const agent = ref<Agent>();
  const iceServers = ref<IceServer[]>(getDefaultIceServers());
  const isInitialised = ref(false);
  const hasJoined = ref(false);
  const isLoading = ref(false);
  const connections = ref<Peer[]>([]);
  const reactions = ref<Reaction[]>([]);
  const localEventLog = ref<EventLogItem[]>([]);
  const showPreview = ref(true);

  // Computed properties from media devices
  const localStream = computed(() => mediaDevices.stream.value);
  const devices = computed(() => mediaDevices.availableDevices.value);
  const audioPermissionGranted = computed(() => mediaDevices.mediaPermissions.value.microphone.granted);
  const videoPermissionGranted = computed(() => mediaDevices.mediaPermissions.value.camera.granted);

  // Clean up on unmount
  onUnmounted(() => {
    onLeave();
  });

  // Get agent/me
  async function fetchAgent() {
    const agentData = await agentClient.me();
    agent.value = agentData;
  }

  if (!agent.value) {
    fetchAgent();
  }

  // Pre-request permissions when component initializes
  watch([() => enabled, () => devices.value], ([newEnabled, newDevices]) => {
    if (newEnabled && !audioPermissionGranted.value && newDevices.length > 0) {
      mediaDevices.requestPermissions({
        audio: true,
        video: !!localState.value.settings.video,
      });
    }
  });

  // Show preview when enabled and permissions granted
  watch(
    [() => enabled, () => showPreview.value, () => videoPermissionGranted.value, () => hasJoined.value],
    async ([isEnabled, isShowPreview, hasVideoPermission, isJoined]) => {
      if (isEnabled && !isJoined && hasVideoPermission && !isShowPreview) {
        await mediaDevices.requestPermissions({
          audio: !!localState.value.settings.audio,
          video: !!localState.value.settings.video,
        });
        showPreview.value = true;
      }

      if (!isEnabled && isShowPreview && !isJoined) {
        mediaDevices.stopStream();
        showPreview.value = false;
      }
    }
  );

  // Initialize WebRTC manager
  watch(
    [() => source, () => perspective.uuid, () => agent.value, isInitialised, hasJoined],
    ([newSource, perspectiveUuid, agentValue, isInit, joined]) => {
      if (newSource && perspectiveUuid && agentValue && !isInit) {
        manager.value = new WebRTCManager({
          source: newSource,
          perspective,
          agent: agentClient,
        });

        setupEventListeners();
        isInitialised.value = true;
      }
    }
  );

  // Setup WebRTC event listeners
  function setupEventListeners() {
    if (!manager.value) return;

    manager.value.on(Event.PEER_ADDED, (did: string, connection: Peer["connection"]) => {
      connections.value = [...connections.value, { did, connection, state: { settings: defaultSettings } }];
    });

    manager.value.on(Event.PEER_REMOVED, (did: string) => {
      connections.value = connections.value.filter((c) => c.did !== did);
      events?.onPeerLeave && events.onPeerLeave(did);
    });

    manager.value.on(Event.CONNECTION_ESTABLISHED, (did: string) => {
      isLoading.value = false;
      events?.onPeerJoin && events.onPeerJoin(did);
      manager.value?.sendMessage("request-state", did);
    });

    manager.value.on(Event.EVENT, (did: string, event: EventLogItem) => {
      localEventLog.value = [...localEventLog.value, event];
    });

    manager.value.on(Event.MESSAGE, (senderDid: string, type: string, message: any) => {
      if (type === "reaction") {
        reactions.value = [...reactions.value, { did: senderDid, reaction: message }];
      }

      if (type === "request-state" && senderDid !== agent.value!.did) {
        manager.value?.sendMessage("state", localState.value);
      }

      if (type === "state" && senderDid !== agent.value!.did) {
        const match = connections.value.find((c) => c.did === senderDid);
        if (!match) return;

        const newPeer = { ...match, state: message };

        connections.value = [...connections.value.filter((c) => c.did !== senderDid), newPeer];
      }
    });
  }

  // Update WebRTC peers with new stream tracks
  function updatePeersWithStream() {
    if (!localStream.value) return;

    const [videoTrack] = localStream.value.getVideoTracks();
    const [audioTrack] = localStream.value.getAudioTracks();

    // Update all peers with the current tracks
    for (let peer of connections.value) {
      if (videoTrack) peer.connection.peer.addTrack(videoTrack, localStream.value);
      if (audioTrack) peer.connection.peer.addTrack(audioTrack, localStream.value);
    }
  }

  /**
   * Handle reactions
   */
  async function onReaction(reaction: string) {
    await manager.value?.sendMessage("reaction", reaction);
  }

  /**
   * Change video input source
   */
  async function onChangeCamera(deviceId: string) {
    const newSettings = { ...localState.value.settings, video: { ...videoDimensions, deviceId: deviceId } };

    // Use mediaDevices to switch camera
    mediaDevices.selectCamera(deviceId);
    await mediaDevices.restartStream();
    updatePeersWithStream();

    // Notify others of state change
    onChangeState({ ...localState.value, settings: newSettings });

    // Persist settings
    setForVersion(version, "cameraDeviceId", `${deviceId}`);
  }

  /**
   * Change audio input source
   */
  async function onChangeAudio(deviceId: string) {
    const newSettings = { ...localState.value.settings, audio: { deviceId: deviceId } };

    // Use mediaDevices to switch microphone
    mediaDevices.selectMicrophone(deviceId);
    await mediaDevices.restartStream();
    updatePeersWithStream();

    // Persist settings
    setForVersion(version, "audioDeviceId", `${deviceId}`);

    // Notify others of state change
    onChangeState({ ...localState.value, settings: newSettings });
  }

  /**
   * Enable/disable video input
   */
  async function onToggleCamera(enabled: boolean) {
    const videoDeviceIdFromLocalStorage = getForVersion(version, "cameraDeviceId");

    const newSettings = {
      ...localState.value.settings,
      video: enabled ? { ...videoDimensions, deviceId: videoDeviceIdFromLocalStorage || undefined } : false,
    };

    if (enabled) {
      // If enabling video, set device ID and restart stream
      if (videoDeviceIdFromLocalStorage) mediaDevices.selectCamera(videoDeviceIdFromLocalStorage);

      await mediaDevices.requestPermissions({ audio: !!localState.value.settings.audio, video: true });
      updatePeersWithStream();
    } else {
      // Just disable the video track without stopping it
      mediaDevices.toggleTrack("video", false);
    }

    // Notify others of state change
    onChangeState({ ...localState.value, settings: newSettings });
  }

  /**
   * Enable/disable audio input
   */
  async function onToggleAudio(enabled: boolean) {
    const audioDeviceIdFromLocalStorage = getForVersion(version, "audioDeviceId");

    const newSettings = {
      ...localState.value.settings,
      audio: enabled ? { deviceId: audioDeviceIdFromLocalStorage || undefined } : false,
    };

    if (enabled) {
      // If enabling audio, set device ID and restart stream
      if (audioDeviceIdFromLocalStorage) mediaDevices.selectMicrophone(audioDeviceIdFromLocalStorage);

      await mediaDevices.requestPermissions({ audio: true, video: !!localState.value.settings.video });
      updatePeersWithStream();
    } else {
      // Just disable the audio track without stopping it
      mediaDevices.toggleTrack("audio", false);
    }

    // Notify others of state change
    onChangeState({ ...localState.value, settings: newSettings });
  }

  /**
   * Update transcription setting
   */
  async function updateTranscriptionSetting(setting: string, value: any) {
    const newSettings = {
      ...localState.value.settings,
      transcriber: { ...localState.value.settings.transcriber, [setting]: value },
    };

    // Notify others of state change when toggling 'on' setting
    if (setting === "on") onChangeState({ ...localState.value, settings: newSettings });
    // Otherwise just update local state
    else localState.value = { ...localState.value, settings: newSettings };
  }

  /**
   * Enable/disable screen share
   */
  async function onToggleScreenShare(enabled: boolean) {
    const newSettings = { ...localState.value.settings, screen: enabled };

    if (enabled) {
      try {
        // Use mediaDevices to manage screen share
        await mediaDevices.startScreenShare();
        updatePeersWithStream();

        // Add ended event handler to auto-disable when user stops sharing
        if (localStream.value) {
          const videoTrack = localStream.value.getVideoTracks()[0];
          if (videoTrack) videoTrack.onended = () => onToggleScreenShare(false);
        }
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    } else {
      // Restart the regular camera stream
      await mediaDevices.restartStream();
      updatePeersWithStream();
    }

    // Notify others of state change
    onChangeState({ ...localState.value, settings: newSettings });
  }

  /**
   * Change ICE servers
   */
  function onChangeIceServers(newServers: IceServer[]) {
    iceServers.value = newServers;
    setForVersion(version, "iceServers", JSON.stringify(newServers));
    if (manager.value) manager.value.iceServers = newServers;
  }

  /**
   * Broadcast state changes to other peers
   */
  const broadcastStateChange = (newState: Peer["state"]) => {
    manager.value?.sendMessage("state", newState);
  };

  const throttledStateBroadcast = throttle(broadcastStateChange, 100);

  function onChangeState(newState: Peer["state"]) {
    localState.value = newState;
    throttledStateBroadcast(newState);
  }

  /**
   * Join a WebRTC room
   */
  async function onJoin({ initialState }: JoinProps = {}) {
    isLoading.value = true;

    const joinSettings = { ...localState.value.settings };

    // Check if the user has no video devices
    const hasVideoDevices = mediaDevices.cameras.value.length > 0;
    if (!hasVideoDevices) joinSettings.video = false;
    // Set local state
    localState.value = { ...initialState, settings: joinSettings };

    // Make sure we have media permissions
    await mediaDevices.requestPermissions({ audio: !!joinSettings.audio, video: !!joinSettings.video });

    if (manager.value && localStream.value) {
      // Join the WebRTC room with our stream
      const stream = await manager.value.join(joinSettings);
      hasJoined.value = true;
    } else {
      console.log("Error: No WebRTCManager instance or stream when trying to join!");
      isLoading.value = false;
    }
  }

  /**
   * Leave a WebRTC room
   */
  async function onLeave() {
    // Stop media stream
    mediaDevices.stopStream();

    // Leave WebRTC room
    await manager.value?.leave();

    // Reset state
    connections.value = [];
    reactions.value = [];
    isLoading.value = false;
    hasJoined.value = false;
    showPreview.value = false;
  }

  return {
    localStream,
    localState,
    localEventLog,
    connections: connections as Ref<Peer[]>,
    devices,
    iceServers,
    reactions,
    isInitialised,
    hasJoined,
    isLoading,
    audioPermissionGranted,
    videoPermissionGranted,
    onJoin,
    onLeave,
    onReaction,
    onToggleCamera,
    onChangeCamera,
    onToggleAudio,
    onChangeAudio,
    onToggleScreenShare,
    onChangeState,
    onChangeIceServers,
    updateTranscriptionSetting,
  };
}
