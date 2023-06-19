import { useEffect, useState, useRef, useCallback } from "preact/hooks";
import {
  getForVersion,
  setForVersion,
  throttle,
  getDefaultIceServers,
} from "@fluxapp/utils";
import { version } from "../package.json";

import {
  Connection,
  Event,
  Settings,
  EventLogItem,
  WebRTCManager,
  IceServer,
} from "@fluxapp/webrtc";

import { getMe, Me } from "@fluxapp/api";
import { videoSettings } from "@fluxapp/constants";

const { defaultSettings, videoDimensions } = videoSettings;

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
  iceServers: IceServer[];
  reactions: Reaction[];
  localEventLog: EventLogItem[];
  isInitialised: boolean;
  hasJoined: boolean;
  isLoading: boolean;
  audioPermissionGranted: boolean;
  videoPermissionGranted: boolean;
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
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [videoPermissionGranted, setVideoPermissionGranted] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [agent, setAgent] = useState<Me>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [iceServers, setIceServers] = useState<IceServer[]>(
    getDefaultIceServers()
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Peer[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [localEventLog, setLocalEventLog] = useState<EventLogItem[]>([]);

  // Leave on unmount
  useEffect(() => {
    return () => {
      onLeave();
    };
  }, []);

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
  }, [audioPermissionGranted, videoPermissionGranted]);

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
      const joinSettings = { ...localState.settings };

      // Check if the user has no video devices
      const hasVideoDevices = devices.some((d) => d.kind === "videoinput");
      if (!hasVideoDevices) {
        joinSettings.video = false;
      }

      // Check if access has already been given
      const allowedAudioDevices = devices.some(
        (d) => d.kind === "audioinput" && d.label !== ""
      );
      const allowedVideoDevices = devices.some(
        (d) => d.kind === "videoinput" && d.label !== ""
      );

      if (allowedAudioDevices || allowedVideoDevices) {
        setAudioPermissionGranted(allowedAudioDevices);
        setVideoPermissionGranted(allowedVideoDevices);
        return;
      }

      navigator.mediaDevices?.getUserMedia(joinSettings).then(
        () => {
          setAudioPermissionGranted(true);
        },
        (e) => {
          console.error(e);
          setAudioPermissionGranted(false);
        }
      );
    }

    if (enabled && !audioPermissionGranted && devices.length > 0) {
      askForPermission();
    }
  }, [enabled, localState, audioPermissionGranted, devices]);

  /**
   * TogglePreRecording
   *
   * Stop recording user input if user hasn't joined yet and goes to another view
   */
  useEffect(() => {
    async function TogglePreRecording() {
      // Return if permission denied
      if (!videoPermissionGranted) {
        return;
      }

      if (enabled && !showPreview) {
        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: localState.settings.audio,
          video: localState.settings.video,
        });
        setLocalStream(newLocalStream);
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
  }, [enabled, showPreview, videoPermissionGranted, hasJoined, localState]);

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
            setLocalState((oldState) => {
              manager.current?.sendMessage("state", oldState);
              return oldState;
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

    const newLocalStream = await navigator.mediaDevices.getUserMedia(
      newSettings
    );

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });

      updateStream(newLocalStream);

      // Notify others of state change
      onChangeState({ ...localState, settings: newSettings });
    } else {
      setLocalStream(newLocalStream);
    }

    // Persist settings
    setForVersion(version, "cameraDeviceId", `${deviceId}`);
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
    setForVersion(version, "audioDeviceId", `${deviceId}`);

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Enable/disable video input
   */
  async function onToggleCamera(enabled: boolean) {
    const videoDeviceIdFromLocalStorage = getForVersion(
      version,
      "cameraDeviceId"
    );

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

    const newLocalStream = await navigator.mediaDevices.getUserMedia({
      audio: localState.settings.audio,
      video: {
        ...videoDimensions,
        deviceId: videoDeviceIdFromLocalStorage || undefined,
      },
    });

    // If not yet joined the room, simply disable video track
    if (!enabled) {
      if (newLocalStream.getVideoTracks()[0]) {
        newLocalStream.getVideoTracks()[0].enabled = false;
      }
    }

    // If first time, set setVideoPermissionGranted
    if (!videoPermissionGranted) {
      setVideoPermissionGranted(true);
    }

    // If no localstream
    if (!localStream) {
      setLocalStream(newLocalStream);
    } else {
      updateStream(newLocalStream);
    }

    // Notify others of state change
    onChangeState({ ...localState, settings: newSettings });
  }

  /**
   * Enable/disable audio input
   */
  async function onToggleAudio(enabled: boolean) {
    const audioDeviceIdFromLocalStorage = getForVersion(
      version,
      "audioDeviceId"
    );

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
      await onStartScreenShare();
    } else {
      await onEndScreenShare();
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

      mediaStream.getVideoTracks()[0].onended = () =>
        onToggleScreenShare(false);
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

    // Update all peers (Important, as peer expects the same stream)
    // -> https://github.com/feross/simple-peer/issues/634#issuecomment-621761586
    for (let peer of connections) {
      if (videoTrack) {
        const oldVideoTrack = localStream.getVideoTracks()[0];

        if (oldVideoTrack) {
          peer.connection.peer.replaceTrack(
            oldVideoTrack,
            videoTrack,
            localStream
          );
        } else {
          peer.connection.peer.addTrack(videoTrack, localStream);
        }
      }

      if (audioTrack) {
        const oldAudioTrack = localStream.getAudioTracks()[0];

        if (oldAudioTrack) {
          peer.connection.peer.replaceTrack(
            localStream.getAudioTracks()[0],
            audioTrack,
            localStream
          );
        } else {
          peer.connection.peer.addTrack(audioTrack, localStream);
        }
      }
    }

    // Update local state
    if (videoTrack) {
      const oldVideoTrack = localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStream?.removeTrack(oldVideoTrack);
        localStream?.addTrack(videoTrack);
      } else {
        localStream?.addTrack(videoTrack);
      }
    }

    if (audioTrack) {
      const oldAudioTrack = localStream.getAudioTracks()[0];
      if (oldAudioTrack) {
        localStream?.removeTrack(oldAudioTrack);
        localStream?.addTrack(audioTrack);
      } else {
        localStream?.addTrack(audioTrack);
      }
    }
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

  function onChangeIceServers(newServers: IceServer[]) {
    setIceServers(newServers);
    setForVersion(version, "iceServers", JSON.stringify(newServers));
    manager.current.iceServers = newServers;
  }

  async function onJoin({ initialState }) {
    setIsLoading(true);

    const joinSettings = { ...localState.settings };

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
  };
}
