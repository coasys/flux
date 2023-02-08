import WebRTCManager, { Event, Settings } from "../WebRTCManager";
import { useEffect, useState, useRef } from "preact/hooks";
import { Peer, Reaction } from "../types";
import { defaultSettings } from "../constants";
import getMe, { Me } from "utils/api/getMe";

type Props = {
  source: string;
  uuid: string;
  events?: {
    onPeerJoin?: (uuid: string) => void;
    onPeerLeave?: (uuid: string) => void;
  };
};

export default function useWebRTC({ source, uuid, events }: Props) {
  const manager = useRef<WebRTCManager>();
  const [agent, setAgent] = useState<Me>();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Peer[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);

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

      manager.current.on(Event.CONNECTION_STATE, (did, state) => {
        if (state === "connected") {
          setIsLoading(false);
          events?.onPeerJoin && events.onPeerJoin(did);
        }
      });

      manager.current.on(Event.CONNECTION_STATE_DATA, (did, state) => {
        if (state === "connected") {
          manager.current.sendMessage("request-settings", did);
        }
      });

      manager.current.on(Event.MESSAGE, (did, type: string, message: any) => {
        if (type === "reaction") {
          setReactions([...reactions, { did, reaction: message }]);
        }

        if (type === "request-settings" && did !== agent.did) {
          manager.current.sendMessage("settings", settings);
        }

        if (type === "settings" && did !== agent.did) {
          setConnections((oldConnections) => {
            const match = oldConnections.find((c) => c.did === did);
            if (!match) {
              return oldConnections;
            }

            const newPeer = {
              ...match,
              settings: message,
            };

            return [...oldConnections.filter((c) => c.did !== did), newPeer];
          });
        }
      });

      setIsInitialised(true);

      return () => {
        manager.current.leave();
      };
    }
  }, [source, uuid, isInitialised, agent]);

  async function onJoin() {
    setIsLoading(true);
    const stream = await manager.current?.join(settings);
    setLocalStream(stream);
    setHasJoined(true);
  }

  async function onLeave() {
    await manager.current?.leave();
    setConnections([]);
    setLocalStream(null);
    setHasJoined(false);
  }

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

  async function onToggleCamera(enabled: boolean) {
    if (localStream) {
      if (localStream.getVideoTracks()[0]) {
        localStream.getVideoTracks()[0].enabled = enabled;
      } else {
        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: settings.audio,
          video: enabled,
        });
        setLocalStream(newLocalStream);
      }
    }
  }

  async function onToggleAudio(enabled: boolean) {
    if (localStream) {
      if (localStream.getAudioTracks()[0]) {
        localStream.getAudioTracks()[0].enabled = enabled;
      } else {
        const newLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: enabled,
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
      audio: true,
      video: true,
    });

    // Ensure screen sharing has stopped
    const allTracks = localStream.getTracks();
    for (var i = 0; i < allTracks.length; i++) allTracks[i].stop();

    newLocalStream.getVideoTracks()[0].enabled = settings.video;
    newLocalStream.getAudioTracks()[0].enabled = settings.audio;

    setSettings({ ...settings, screen: false });
    manager.current?.sendMessage("settings", { ...settings, screen: false });
    updateStream(newLocalStream);
  }

  function updateStream(stream: MediaStream) {
    for (let peer of connections) {
      const peerConnection = peer.connection.peerConnection
        .getSenders()
        .find((s) => (s.track ? s.track.kind === "video" : false));
      peerConnection.replaceTrack(stream.getVideoTracks()[0]);
    }

    setLocalStream(stream);
  }

  return {
    localStream,
    connections,
    settings,
    reactions,
    isInitialised,
    hasJoined,
    isLoading,
    onJoin,
    onLeave,
    onChangeSettings,
    onReaction,
  };
}
