import WebRTCManager, { Event } from "../WebRTCManager";
import { useEffect, useState, useRef } from "preact/hooks";
import { Connection, Peer } from "../types";
import { defaultSettings } from "../constants";

export default function useWebRTC({ source, uuid }) {
  const manager = useRef<WebRTCManager>();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [connections, setConnections] = useState<Peer[]>([]);

  useEffect(() => {
    if (source && uuid && !isInitialised) {
      manager.current = new WebRTCManager({ source, uuid });

      manager.current.on(Event.PEER_ADDED, (did, connection: Connection) => {
        setConnections((oldConnections) => [
          ...oldConnections,
          { did, connection, settings: defaultSettings },
        ]);
      });

      manager.current.on(Event.PEER_REMOVED, (did) => {
        const filter = connections.filter((c) => c.did !== did);
        setConnections((oldConnections) => {
          return oldConnections.filter((c) => c.did !== did);
        });
      });

      manager.current.on(Event.MESSAGE, (did, event: MessageEvent<any>) => {
        // const match = connections.find((c) => c.did === did);
        // if (!match) {
        //   return;
        // }
        // const newAudioSettings =
        //   event.data === "mute"
        //     ? false
        //     : event.data === "unmute"
        //     ? true
        //     : match.settings.audio;
        // const newVideoSettings =
        //   event.data === "video-off"
        //     ? false
        //     : event.data === "video-on"
        //     ? true
        //     : match.settings.video;
        // const newSettings = {
        //   audio: newAudioSettings,
        //   video: newVideoSettings,
        //   screen: match.settings.screen,
        // };
        // const newPeer = {
        //   ...match,
        //   settings: newSettings,
        // };
        // setConnections([...connections.filter((c) => c.did !== did), newPeer]);
      });

      setIsInitialised(true);

      return () => {
        manager.current.leave();
      };
    }
  }, [source, uuid, isInitialised]);

  async function onJoin() {
    const stream = await manager.current?.join();
    setLocalStream(stream);
    setHasJoined(true);
  }

  async function onLeave() {
    await manager.current?.leave();
    setLocalStream(null);
    setHasJoined(false);
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
    isInitialised,
    hasJoined,
    onJoin,
    onLeave,
    onToggleCamera,
  };
}
