import {
  WebRTCManager,
  Event,
  EventLogItem,
  Settings,
} from "utils/helpers";
import { useEffect, useState, useRef, useCallback } from "preact/hooks";
import { Peer } from "../types";
import { defaultSettings } from "../constants";
import getMe, { Me } from "utils/api/getMe";
import { getForVersion, setForVersion } from "utils/helpers";
import throttle from "../utils/throttle";

const defaultState = {
  spriteIndex: 0,
  isDrawing: false,
  x: 0,
  y: 0,
};

type Props = {
  enabled: boolean;
  source: string;
  uuid: string;
  events?: {
    onPeerJoin?: (uuid: string) => void;
    onPeerLeave?: (uuid: string) => void;
    onDrawLine?: (from: [number, number], to: [number, number]) => void;
  };
};

export type WebRTC = {
  localStream: MediaStream;
  localState: Peer["state"];
  localEventLog: EventLogItem[];
  connections: Peer[];
  devices: MediaDeviceInfo[];
  settings: Settings;
  isInitialised: boolean;
  hasJoined: boolean;
  isLoading: boolean;
  permissionGranted: boolean;
  onJoin: (initialState: Peer["state"]) => Promise<void>;
  onLeave: () => Promise<void>;
  onChangeCamera: (deviceId: string) => void;
  onChangeAudio: (deviceId: string) => void;
  onChangeSettings: (newSettings: Settings) => void;
  onChangeState: (newState: Peer["state"]) => void;
};

export default function useWebRTC({
  enabled,
  source,
  uuid,
  events,
}: Props): WebRTC {
  const manager = useRef<WebRTCManager>();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [devicesEnumerated, setDevicesEnumerated] = useState(false);
  const [agent, setAgent] = useState<Me>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [localState, setLocalState] = useState<Peer["state"]>(defaultState);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Peer[]>([]);
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

  // Ask for permission
  useEffect(() => {
    async function askForPermission() {
      const videoDeviceId =
        typeof settings.video !== "boolean" && settings.video.deviceId
          ? settings.video.deviceId
          : getForVersion("cameraDeviceId");

      const audioDeviceId =
        typeof settings.audio !== "boolean" && settings.audio.deviceId
          ? settings.audio.deviceId
          : getForVersion("audioDeviceId");

      const joinSettings = { ...defaultSettings };
      if (videoDeviceId && typeof joinSettings.video !== "boolean") {
        joinSettings.video.deviceId = videoDeviceId;
      }
      if (audioDeviceId) {
        joinSettings.audio = {
          deviceId: audioDeviceId,
        };
      }

      navigator.mediaDevices.getUserMedia(joinSettings).then(
        (stream) => {
          setPermissionGranted(true);
          setLocalStream(stream);
        },
        (e) => {
          console.error(e);
          setPermissionGranted(false);
        }
      );
    }
    if (enabled && !permissionGranted) {
      askForPermission();
    }
  }, [enabled, permissionGranted]);

  // Get user devices
  useEffect(() => {
    async function getDevices() {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
    }
    if (permissionGranted && !devicesEnumerated) {
      getDevices();
      setDevicesEnumerated(true);
    }
  }, [permissionGranted, devicesEnumerated]);

  useEffect(() => {
    if (source && uuid && agent && !isInitialised) {
      manager.current = new WebRTCManager({ source, uuid });

      manager.current.on(
        Event.PEER_ADDED,
        (did, connection: Peer["connection"]) => {
          setConnections((oldConnections) => [
            ...oldConnections,
            {
              did,
              connection,
              settings: defaultSettings,
              state: {
                spriteIndex: 1,
                isDrawing: false,
                x: 0,
                y: 0,
              },
            },
          ]);

          events?.onPeerJoin && events.onPeerJoin(did);
        }
      );

      manager.current.on(Event.PEER_REMOVED, (did) => {
        setConnections((oldConnections) => {
          return oldConnections.filter((c) => c.did !== did);
        });

        events?.onPeerLeave && events.onPeerLeave(did);
      });

      manager.current.on(Event.CONNECTION_STATE, (did, state) => {
        if (state === "connected") {
          setIsLoading(false);
          events?.onPeerJoin && events.onPeerJoin(did);
        }
      });

      manager.current.on(Event.CONNECTION_STATE_DATA, (did, state) => {
        if (state === "connected") {
          manager.current.sendMessage("request-position", did);
        }
      });

      manager.current.on(Event.EVENT, (did, event) => {
        setLocalEventLog((oldEvents) => [...oldEvents, event]);
      });

      manager.current.on(
        Event.MESSAGE,
        (senderDid: string, type: string, message: any) => {
          if (type === "request-state" && senderDid !== agent.did) {
            manager.current.sendMessage("state", localState);
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

          if (type === "settings" && senderDid !== agent.did) {
            setConnections((oldConnections) => {
              const match = oldConnections.find((c) => c.did === senderDid);
              if (!match) {
                return oldConnections;
              }

              const newPeer = {
                ...match,
                settings: message,
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
          await manager.current.leave();
          manager.current = null;
        }
      };
    }
  }, [source, uuid, isInitialised, hasJoined, agent]);

  function onChangeSettings(newSettings: Settings) {
    const videoChanged = newSettings.video !== settings.video;

    if (videoChanged) {
      onToggleCamera(newSettings.video);
      setSettings(newSettings);
      manager.current?.sendMessage("settings", newSettings);
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

  async function onToggleCamera(newSettings: Settings["video"]) {
    if (localStream) {
      if (localStream.getVideoTracks()[0]) {
        localStream.getVideoTracks()[0].enabled = !!newSettings;
      } else {
        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: settings.audio,
          video: newSettings,
        });
        setLocalStream(newLocalStream);
      }
    }
  }

  async function onChangeCamera(deviceId: string) {
    const newSettings = {
      audio: settings.audio,
      screen: settings.screen,
      video: { deviceId: deviceId },
    };

    setSettings(newSettings);

    if (localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });

      const newLocalStream = await navigator.mediaDevices.getUserMedia(
        newSettings
      );

      console.log("newSettings: ", newSettings);
      updateStream(newLocalStream);
    }

    // Persist settings
    setForVersion("cameraDeviceId", `${deviceId}`);
  }

  async function onChangeAudio(deviceId: string) {
    const newSettings = {
      audio: { deviceId: deviceId },
      screen: settings.screen,
      video: settings.video,
    };

    setSettings(newSettings);

    if (localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });

      const newLocalStream = await navigator.mediaDevices.getUserMedia(
        newSettings
      );
      updateStream(newLocalStream);
    }

    // Persist settings
    setForVersion("audioDeviceId", `${deviceId}`);
  }

  function updateStream(stream: MediaStream) {
    const [videoTrack] = stream.getVideoTracks();
    const [audioTrack] = stream.getAudioTracks();

    for (let peer of connections) {
      if (videoTrack) {
        const videoSender = peer.connection.peerConnection
          .getSenders()
          .find((s) => s.track.kind === videoTrack?.kind);
        videoSender.replaceTrack(videoTrack);
      }

      if (audioTrack) {
        const audioSender = peer.connection.peerConnection
          .getSenders()
          .find((s) => s.track.kind === audioTrack?.kind);
        audioSender.replaceTrack(audioTrack);
      }
    }

    setLocalStream(stream);
  }

  async function onJoin(initialState: Peer["state"]) {
    setIsLoading(true);

    const videoDeviceId =
      typeof settings.video !== "boolean" && settings.video.deviceId
        ? settings.video.deviceId
        : getForVersion("cameraDeviceId");

    const audioDeviceId =
      typeof settings.audio !== "boolean" && settings.audio.deviceId
        ? settings.audio.deviceId
        : getForVersion("audioDeviceId");

    const joinSettings = { ...defaultSettings };
    if (videoDeviceId && typeof joinSettings.video !== "boolean") {
      joinSettings.video.deviceId = videoDeviceId;
    }
    if (audioDeviceId) {
      joinSettings.audio = {
        deviceId: audioDeviceId,
      };
    }

    const stream = await manager.current?.join(joinSettings);
    setLocalState(initialState);
    setLocalStream(stream);
    setHasJoined(true);
  }

  async function onLeave() {
    await manager.current?.leave();
    setConnections([]);
    setLocalStream(null);
    setIsLoading(false);
    setHasJoined(false);
  }

  return {
    localStream,
    localState,
    localEventLog,
    connections,
    devices,
    settings,
    isInitialised,
    hasJoined,
    isLoading,
    permissionGranted,
    onJoin,
    onLeave,
    onChangeCamera,
    onChangeAudio,
    onChangeSettings,
    onChangeState,
  };
}
