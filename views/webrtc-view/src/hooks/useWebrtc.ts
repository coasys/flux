import WebRTCManager, { Event, Settings } from "../WebRTCManager";
import { useEffect, useState, useRef } from "preact/hooks";
import { Peer, Reaction } from "../types";
import { defaultSettings } from "../constants";
import getMe, { Me } from "utils/api/getMe";

export default function useWebRTC({ source, uuid }) {
  const manager = useRef<WebRTCManager>();
  const [agent, setAgent] = useState<Me>();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
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
        }
      );

      manager.current.on(Event.PEER_REMOVED, (did) => {
        console.log("peer removed");
        setConnections((oldConnections) => {
          return oldConnections.filter((c) => c.did !== did);
        });
      });

      manager.current.on(Event.CONNECTION_STATE, (did, state) => {
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
          const match = connections.find((c) => c.did === did);
          if (!match) return;

          const newPeer = {
            ...match,
            settings: message,
          };

          setConnections((oldConnections) => [
            ...oldConnections.filter((c) => c.did !== did),
            newPeer,
          ]);
        }
      });

      setIsInitialised(true);

      return () => {
        manager.current.leave();
      };
    }
  }, [source, uuid, isInitialised, agent]);

  async function onJoin() {
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

  function onToggleCamera() {
    if (localStream) {
      const enabled = localStream.getVideoTracks()[0].enabled;
      localStream.getVideoTracks()[0].enabled = !enabled;
    }
  }

  return {
    localStream,
    connections,
    reactions,
    isInitialised,
    hasJoined,
    setSettings,
    onJoin,
    onLeave,
    onToggleCamera,
    onReaction,
  };
}
