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
  settings: Settings;
  state?: any;
};

export type Reaction = {
  did: string;
  reaction: string;
};

type Props = {
  enabled: boolean;
  source: string;
  uuid: string;
  defaultState: any;
  events?: {
    onPeerJoin?: (uuid: string) => void;
    onPeerLeave?: (uuid: string) => void;
  };
};

export type WebRTC = {
  localStream: MediaStream | null;
  localState: Peer["state"];
  connections: Peer[];
  localEventLog: EventLogItem[];
  devices: MediaDeviceInfo[];
  settings: Settings;
  reactions: Reaction[];
  isInitialised: boolean;
  hasJoined: boolean;
  isLoading: boolean;
  permissionGranted: boolean;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  onChangeSettings: (newSettings: Settings) => void;
  onReaction: (reaction: string) => Promise<void>;
  onSendTestSignal: (recipientId: string) => Promise<void>;
  onSendTestBroadcast: () => Promise<void>;
  onChangeCamera: (deviceId: string) => void;
  onChangeAudio: (deviceId: string) => void;
  onChangeState: (newState: Peer["state"]) => void;
  onGetStats: () => void;
};

export default function useWebRTC({
  enabled,
  source,
  uuid,
  events,
}: Props): WebRTC {
  const manager = useRef<WebRTCManager | null>();
  const [localState, setLocalState] = useState<Peer["state"]>();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [agent, setAgent] = useState<Me>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
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
        typeof settings.video !== "boolean" && settings.video.deviceId
          ? settings.video.deviceId
          : localstorage.getForVersion("cameraDeviceId");

      const audioDeviceIdFromLocalStorage =
        typeof settings.audio !== "boolean" && settings.audio.deviceId
          ? settings.audio.deviceId
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
          setSettings(joinSettings);
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
  }, [enabled, permissionGranted, devices]);

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
          audio: settings.audio,
          video: settings.video,
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
  }, [enabled, showPreview, permissionGranted, hasJoined]);

  useEffect(() => {
    if (source && uuid && agent && !isInitialised) {
      manager.current = new WebRTCManager({ source, uuid });

      manager.current.on(
        Event.PEER_ADDED,
        (did, connection: Peer["connection"]) => {
          setConnections((oldConnections) => [
            ...oldConnections,
            { did, connection, settings: defaultSettings },
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

      manager.current.on(Event.CONNECTION_ESTABLISHED, (did) => {
        setIsLoading(false);
        events?.onPeerJoin && events.onPeerJoin(did);
        manager.current?.sendMessage("request-settings", did);
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

          if (type === "request-settings" && senderDid !== agent.did) {
            manager.current?.sendMessage("settings", settings);
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
  }, [source, uuid, isInitialised, hasJoined, agent, settings]);

  async function onReaction(reaction: string) {
    await manager.current?.sendMessage("reaction", reaction);
  }

  function onChangeSettings(newSettings: Settings) {
    const videoChanged = newSettings.video !== settings.video;
    const audioChanged = newSettings.audio !== settings.audio;
    const screenChanged = newSettings.screen !== settings.screen;

    if (videoChanged) {
      onToggleCamera(newSettings.video);
      setSettings(newSettings);
      manager.current?.sendMessage("settings", newSettings);
    }

    if (audioChanged) {
      onToggleAudio(newSettings.audio);
      setSettings(newSettings);
      manager.current?.sendMessage("settings", newSettings);
    }

    if (screenChanged) {
      newSettings.screen ? onStartScreenShare() : onEndScreenShare();
    }
  }

  async function onChangeCamera(deviceId: string) {
    const newSettings = {
      audio: settings.audio,
      screen: settings.screen,
      video: { ...videoDimensions, deviceId: deviceId },
    };

    setSettings(newSettings);

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
  }

  async function onChangeAudio(deviceId: string) {
    const newSettings = {
      audio: { deviceId: deviceId },
      screen: settings.screen,
      video: settings.video,
    };

    setSettings(newSettings);

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
  }

  async function onToggleCamera(newSettings: Settings["video"]) {
    if (localStream) {
      if (localStream.getVideoTracks()[0]) {
        localStream.getVideoTracks()[0].enabled = !!newSettings;
      } else {
        console.log("newSettings!", newSettings);

        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: settings.audio,
          video: newSettings,
        });
        setLocalStream(newLocalStream);
      }
    }
  }

  async function onToggleAudio(newSettings: Settings["audio"]) {
    if (localStream) {
      if (localStream.getAudioTracks()[0]) {
        localStream.getAudioTracks()[0].enabled = !!newSettings;
      } else {
        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: newSettings,
          video: settings.video,
        });
        setLocalStream(newLocalStream);
      }
    }
  }

  async function onStartScreenShare() {
    if (localStream) {
      let mediaStream;

      if (navigator.mediaDevices.getDisplayMedia) {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }

      mediaStream.getVideoTracks()[0].onended = () => onEndScreenShare();

      setSettings({ ...settings, screen: true });
      manager.current?.sendMessage("settings", { ...settings, screen: true });
      updateStream(mediaStream);
    }
  }

  async function onEndScreenShare() {
    const newLocalStream = await navigator.mediaDevices.getUserMedia({
      audio: settings.audio,
      video: settings.video,
    });

    // Ensure screen sharing has stopped
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setSettings({ ...settings, screen: false });
    manager.current?.sendMessage("settings", { ...settings, screen: false });
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

  async function onSendTestSignal(recipientId: string) {
    if (manager.current) {
      manager.current.sendTestSignal(recipientId);
    }
  }

  async function onSendTestBroadcast() {
    if (manager.current) {
      manager.current.sendTestBroadcast();
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

  async function onGetStats() {
    // if (manager.current) {
    //   manager.current.getStats();
    // }
  }

  async function onJoin(initialState?: Peer["state"]) {
    setIsLoading(true);

    const videoDeviceIdFromLocalStorage =
      typeof settings.video !== "boolean" && settings.video.deviceId
        ? settings.video.deviceId
        : localstorage.getForVersion("cameraDeviceId");

    const audioDeviceIdFromLocalStorage =
      typeof settings.audio !== "boolean" && settings.audio.deviceId
        ? settings.audio.deviceId
        : localstorage.getForVersion("audioDeviceId");

    const joinSettings = { ...settings };

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

    if (manager.current) {
      const stream = await manager.current.join(joinSettings);
      setLocalStream(stream);
      setHasJoined(true);
    }

    if (initialState) {
      setLocalState(initialState);
    }
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
    reactions,
    isInitialised,
    hasJoined,
    isLoading,
    permissionGranted,
    onJoin,
    onLeave,
    onChangeSettings,
    onReaction,
    onSendTestSignal,
    onSendTestBroadcast,
    onChangeCamera,
    onChangeAudio,
    onChangeState,
    onGetStats,
  };
}
