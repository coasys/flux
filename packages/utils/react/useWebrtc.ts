import { useEffect, useState, useRef, useCallback } from "preact/hooks";
import WebRTCManager, {
  Connection,
  Event,
  Settings,
  EventLogItem,
} from "utils/helpers/WebRTCManager";
import {
  defaultSettings,
  videoDimensions,
} from "utils/constants/videoSettings";
import getMe, { Me } from "utils/api/getMe";
import throttle from "utils/helpers/throttle";
import * as localstorage from "utils/helpers/localStorage";

export type Peer = {
  did: string;
  connection: Connection;
  state: {
    settings: Settings;
    [key: string]: any;
  };
};

export type Reaction = {
  did: string;
  reaction: string;
};

type Props = {
  enabled: boolean;
  source: string;
  uuid: string;
  defaultState?: Peer["state"];
  events?: {
    onPeerJoin?: (uuid: string) => void;
    onPeerLeave?: (uuid: string) => void;
  };
};

type JoinProps = {
  initialState?: Peer["state"];
};

export type WebRTC = {
  localStream: MediaStream | null;
  localState: Peer["state"];
  connections: Peer[];
  devices: MediaDeviceInfo[];
  reactions: Reaction[];
  localEventLog: EventLogItem[];
  isInitialised: boolean;
  hasJoined: boolean;
  isLoading: boolean;
  permissionGranted: boolean;
  onJoin: (props: JoinProps) => Promise<void>;
  onLeave: () => Promise<void>;
  onReaction: (reaction: string) => Promise<void>;
  onToggleCamera: (enabled: boolean) => void;
  onChangeCamera: (deviceId: string) => void;
  onToggleAudio: (enabled: boolean) => void;
  onChangeAudio: (deviceId: string) => void;
  onToggleScreenShare: (enabled: boolean) => void;
  onChangeState: (newState: Peer["state"]) => void;
};

export default function useWebRTC({
  enabled,
  source,
  uuid,
  events,
}: Props): WebRTC {
  const defaultState = { settings: defaultSettings };

  const manager = useRef<WebRTCManager | null>();
  const [localState, setLocalState] = useState<Peer["state"]>(defaultState);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [agent, setAgent] = useState<Me>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Peer[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [localEventLog, setLocalEventLog] = useState<EventLogItem[]>([]);

  // Get agent/me
  useEffect(() => {
    async function fetchAgent() {
      const agent = await getMe();
      setAgent(agent);
    }

    if (!agent) {
      fetchAgent();
    }
  }, [agent]);

  /**
   * getDevices - Enumerate user devices
   *
   * 1: Run this on mount to determine if user has any video devices,
   * NB: This will only return the 'devicetype', not labels or id's.
   * 2: Run again AFTER permission has been granted as we need the
   * names of the devices for the "device selector" modal.
   */
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDevices(devices);
      } catch (e) {}
    }

    getDevices();
  }, [permissionGranted]);

  /**
   * askForPermission - Ask for user permission to access audio/video
   *
   * 1: Check if user has videodevices, if not, set video: false to
   * prevent crash.
   * 2: Check if user has previously selected audio/video device, if so
   * use this device when creating stream.
   */
  useEffect(() => {
    async function askForPermission() {
      const videoDeviceIdFromLocalStorage =
        typeof localState.settings.video !== "boolean" &&
        localState.settings.video.deviceId
          ? localState.settings.video.deviceId
          : localstorage.getForVersion("cameraDeviceId");

      const audioDeviceIdFromLocalStorage =
        typeof localState.settings.audio !== "boolean" &&
        localState.settings.audio.deviceId
          ? localState.settings.audio.deviceId
          : localstorage.getForVersion("audioDeviceId");

      const joinSettings = { ...defaultSettings };

      // Check if user has previously specified webcam or audio device
      if (
        videoDeviceIdFromLocalStorage &&
        typeof joinSettings.video !== "boolean"
      ) {
        joinSettings.video = {
          ...videoDimensions,
          deviceId: videoDeviceIdFromLocalStorage,
        };
      }
      if (audioDeviceIdFromLocalStorage) {
        joinSettings.audio = {
          deviceId: audioDeviceIdFromLocalStorage,
        };
      }

      // Check if the user has no video devices
      const hasVideoDevices = devices.some((d) => d.kind === "videoinput");
      if (!hasVideoDevices) {
        joinSettings.video = false;
      }

      navigator.mediaDevices?.getUserMedia(joinSettings).then(
        (stream) => {
          setPermissionGranted(true);
          setLocalStream(stream);
          setLocalState((oldState) => ({
            ...oldState,
            settings: joinSettings,
          }));
        },
        (e) => {
          console.error(e);
          setPermissionGranted(false);
        }
      );
    }
    if (enabled && !permissionGranted && devices.length > 0) {
      askForPermission();
    }
  }, [enabled, localState, permissionGranted, devices]);

  /**
   * TogglePreRecording
   *
   * Stop recording user input if user hasn't joined yet and goes to another view
   */
  useEffect(() => {
    async function TogglePreRecording() {
      // Return if permission denied
      if (!permissionGranted) {
        return;
      }

      if (enabled && !showPreview) {
        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: localState.settings.audio,
          video: localState.settings.video,
        });
        updateStream(newLocalStream);
        setShowPreview(true);
      }

      if (!enabled && showPreview && localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setShowPreview(false);
      }
    }
    if (!hasJoined) {
      TogglePreRecording();
    }
  }, [enabled, showPreview, permissionGranted, hasJoined, localState]);

  /**
   * Attach signal listeners
   */
  useEffect(() => {
    if (source && uuid && agent && !isInitialised) {
      manager.current = new WebRTCManager({ source, uuid });

      manager.current.on(
        Event.PEER_ADDED,
        (did, connection: Peer["connection"]) => {
          setConnections((oldConnections) => [
            ...oldConnections,
            { did, connection, state: defaultState },
          ]);
        }
      );

      manager.current.on(Event.PEER_REMOVED, (did) => {
        setConnections((oldConnections) => {
          return oldConnections.filter((c) => c.did !== did);
        });

        events?.onPeerLeave && events.onPeerLeave(did);
      });

      manager.current.on(Event.CONNECTION_ESTABLISHED, (did) => {
        setIsLoading(false);
        events?.onPeerJoin && events.onPeerJoin(did);
        manager.current?.sendMessage("request-state", did);
      });

      manager.current.on(Event.EVENT, (did, event) => {
        setLocalEventLog((oldEvents) => [...oldEvents, event]);
      });

      manager.current.on(
        Event.MESSAGE,
        (senderDid: string, type: string, message: any) => {
          if (type === "reaction") {
            setReactions([...reactions, { did: senderDid, reaction: message }]);
          }

          if (type === "request-state" && senderDid !== agent.did) {
            manager.current?.sendMessage("state", localState);
          }

          if (type === "state" && senderDid !== agent.did) {
            setConnections((oldConnections) => {
              const match = oldConnections.find((c) => c.did === senderDid);
              if (!match) {
                return oldConnections;
              }

              const newPeer = {
                ...match,
                state: message,
              };

              return [
                ...oldConnections.filter((c) => c.did !== senderDid),
                newPeer,
              ];
            });
          }

          if (type === "state" && senderDid !== agent.did) {
            setConnections((oldConnections) => {
              const match = oldConnections.find((c) => c.did === senderDid);
              if (!match) {
                return oldConnections;
              }

              const newPeer = {
                ...match,
                state: message,
              };

              return [
                ...oldConnections.filter((c) => c.did !== senderDid),
                newPeer,
              ];
            });
          }
        }
      );

      setIsInitialised(true);

      return async () => {
        if (hasJoined) {
          await manager.current?.leave();
          manager.current = null;
        }
      };
    }
  }, [source, uuid, isInitialised, hasJoined, agent, localState]);

  /**
   * Handle reactions
   */
  async function onReaction(reaction: string) {
    await manager.current?.sendMessage("reaction", reaction);
  }

  /**
   * Change video input source
   */
  async function onChangeCamera(deviceId: string) {
    const newSettings = {
      audio: localState.settings.audio,
      screen: localState.settings.screen,
      video: { ...videoDimensions, deviceId: deviceId },
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });

      const newLocalStream = await navigator.mediaDevices.getUserMedia(
        newSettings
      );
      updateStream(newLocalStream);
    }

    // Persist settings
    localstorage.setForVersion("cameraDeviceId", `${deviceId}`);

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Change audio input source
   */
  async function onChangeAudio(deviceId: string) {
    const newSettings = {
      audio: { deviceId: deviceId },
      screen: localState.settings.screen,
      video: localState.settings.video,
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });

      const newLocalStream = await navigator.mediaDevices.getUserMedia(
        newSettings
      );
      updateStream(newLocalStream);
    }

    // Persist settings
    localstorage.setForVersion("audioDeviceId", `${deviceId}`);

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Enable/disable video input
   */
  async function onToggleCamera(enabled: boolean) {
    const videoDeviceIdFromLocalStorage =
      localstorage.getForVersion("cameraDeviceId");

    const newSettings = {
      audio: localState.settings.audio,
      screen: localState.settings.screen,
      video: enabled
        ? {
            ...videoDimensions,
            deviceId: videoDeviceIdFromLocalStorage || undefined,
          }
        : false,
    };

    if (enabled) {
      const newLocalStream = await navigator.mediaDevices.getUserMedia({
        audio: localState.settings.audio,
        video: newSettings.video,
      });
      updateStream(newLocalStream);
    } else {
      if (localStream) {
        if (localStream.getVideoTracks()[0]) {
          localStream.getVideoTracks()[0].enabled = false;
        }
      }
    }

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Enable/disable audio input
   */
  async function onToggleAudio(enabled: boolean) {
    const audioDeviceIdFromLocalStorage =
      localstorage.getForVersion("audioDeviceId");

    const newSettings = {
      audio: enabled
        ? {
            ...videoDimensions,
            deviceId: audioDeviceIdFromLocalStorage || undefined,
          }
        : false,
      video: localState.settings.video,
      screen: localState.settings.screen,
    };

    if (enabled) {
      const newLocalStream = await navigator.mediaDevices.getUserMedia({
        audio: newSettings.audio,
        video: localState.settings.video,
      });
      updateStream(newLocalStream);
    } else {
      if (localStream) {
        if (localStream.getAudioTracks()[0]) {
          localStream.getAudioTracks()[0].enabled = false;
        }
      }
    }

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Enable/disable screen share
   */
  async function onToggleScreenShare(enabled: boolean) {
    const newSettings = {
      audio: localState.settings.audio,
      video: localState.settings.video,
      screen: enabled,
    };

    if (enabled) {
      onStartScreenShare();
    } else {
      onEndScreenShare();
    }

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Start screenshare
   */
  async function onStartScreenShare() {
    if (localStream) {
      let mediaStream;

      if (navigator.mediaDevices.getDisplayMedia) {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }

      mediaStream.getVideoTracks()[0].onended = () => onEndScreenShare();
      updateStream(mediaStream);
    }
  }

  async function onEndScreenShare() {
    const newLocalStream = await navigator.mediaDevices.getUserMedia({
      audio: localState.settings.audio,
      video: localState.settings.video,
    });

    // Ensure screen sharing has stopped
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    updateStream(newLocalStream);
  }

  function updateStream(stream: MediaStream) {
    const [videoTrack] = stream.getVideoTracks();
    const [audioTrack] = stream.getAudioTracks();

    for (let peer of connections) {
      if (videoTrack) {
        peer.connection.peer.replaceTrack(
          peer.connection.peer.streams[0].getVideoTracks()[0],
          videoTrack,
          peer.connection.peer.streams[0]
        );
      }

      if (audioTrack) {
        peer.connection.peer.replaceTrack(
          peer.connection.peer.streams[0].getAudioTracks()[0],
          audioTrack,
          peer.connection.peer.streams[0]
        );
      }
    }

    setLocalStream(stream);
  }

  const broadcastStateChange = (newState: Peer["state"]) => {
    manager.current?.sendMessage("state", newState);
  };

  const throttledStateBroadcast = useCallback(
    throttle(broadcastStateChange, 100),
    []
  );

  function onChangeState(newState: Peer["state"]) {
    setLocalState(newState);
    throttledStateBroadcast(newState);
  }

  async function onJoin({ initialState }) {
    setIsLoading(true);

    const videoDeviceIdFromLocalStorage =
      typeof localState.settings.video !== "boolean" &&
      localState.settings.video.deviceId
        ? localState.settings.video.deviceId
        : localstorage.getForVersion("cameraDeviceId");

    const audioDeviceIdFromLocalStorage =
      typeof localState.settings.audio !== "boolean" &&
      localState.settings.audio.deviceId
        ? localState.settings.audio.deviceId
        : localstorage.getForVersion("audioDeviceId");

    const joinSettings = { ...localState.settings };

    if (
      videoDeviceIdFromLocalStorage &&
      typeof joinSettings.video !== "boolean"
    ) {
      joinSettings.video.deviceId = videoDeviceIdFromLocalStorage;
    }
    if (audioDeviceIdFromLocalStorage) {
      joinSettings.audio = {
        deviceId: audioDeviceIdFromLocalStorage,
      };
    }

    // Check if the user has no video devices
    const hasVideoDevices = devices.some((d) => d.kind === "videoinput");
    if (!hasVideoDevices) {
      joinSettings.video = false;
    }

    // Set local state
    setLocalState({ ...initialState, settings: joinSettings });

    if (manager.current) {
      const stream = await manager.current.join(joinSettings);
      setLocalStream(stream);
      setHasJoined(true);
    }
  }

  async function onLeave() {
    await manager.current?.leave();
    setConnections([]);
    setReactions([]);
    setLocalStream(null);
    setIsLoading(false);
    setHasJoined(false);
    setShowPreview(false);
  }

  return {
    localStream,
    localState,
    localEventLog,
    connections,
    devices,
    reactions,
    isInitialised,
    hasJoined,
    isLoading,
    permissionGranted,
    onJoin,
    onLeave,
    onReaction,
    onToggleCamera,
    onChangeCamera,
    onToggleAudio,
    onChangeAudio,
    onToggleScreenShare,
    onChangeState,
  };
}
