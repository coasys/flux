import { useEffect, useState, useRef } from "preact/hooks";
import { CommunityProvider, AgentProvider } from "utils/react";
import AllCommunities from "./components/AllCommunities";
import WebRTCManager, { Event } from "./WebRTCManager";
import { grid } from "./components/UserGrid/UserGrid.module.css";
import {
  video,
  item,
  details,
} from "./components/UserGrid/Item/Item.module.css";

import styles from "./App.module.css";
import { Connection } from "./types";
import { defaultSettings } from "./constants";

type Peer = {
  did: string;
  connection: Connection;
  settings: {
    video: boolean;
    audio: boolean;
    screen: boolean;
  };
};

function useWebRTC({ source, uuid }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const manager = useRef<WebRTCManager>();
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
        const match = connections.find((c) => c.did === did);

        if (!match) {
          return;
        }

        const newAudioSettings =
          event.data === "mute"
            ? false
            : event.data === "unmute"
            ? true
            : match.settings.audio;
        const newVideoSettings =
          event.data === "video-off"
            ? false
            : event.data === "video-on"
            ? true
            : match.settings.video;

        const newSettings = {
          audio: newAudioSettings,
          video: newVideoSettings,
          screen: match.settings.screen,
        };

        const newPeer = {
          ...match,
          settings: newSettings,
        };
        setConnections([...connections.filter((c) => c.did !== did), newPeer]);
      });

      setIsInitialised(true);
    }
  }, [source, uuid, isInitialised]);

  async function join() {
    const stream = await manager.current?.join();
    setLocalStream(stream);
  }

  function toggleCamera() {
    if (localStream) {
      const enabled = localStream.getVideoTracks()[0].enabled;
      localStream.getVideoTracks()[0].enabled = !enabled;
    }
  }

  return {
    localStream,
    connections,
    isInitialised,
    join,
    toggleCamera,
  };
}

function Peer({ did, connection }) {
  useEffect(() => {
    const remoteStream = new MediaStream();

    connection.peerConnection.ontrack = (event) => {
      console.log("ontrack", event.streams);
      event.streams[0].getTracks().forEach((track) => {
        console.log("added track", { track });
        remoteStream.addTrack(track);
        const videElement = document.getElementById(
          `user-video-${did}`
        ) as HTMLVideoElement;

        if (videElement) {
          videElement.srcObject = remoteStream;
        }
      });
    };
  }, [did, connection]);

  return (
    <div className={item} data-camera-enabled={connection.settings.video}>
      <video
        id={`user-video-${did}`}
        className={video}
        autoPlay
        playsInline
      ></video>
      <div className={details}>
        <j-text>{did}</j-text>
        {!connection.settings.audio && <span>(muted)</span>}
        {!connection.settings.screen && <span>(sharing screen)</span>}
      </div>
    </div>
  );
}

function Channel({ source, uuid }) {
  const videoRef = useRef(null);
  const { connections, join, isInitialised, localStream, toggleCamera } =
    useWebRTC({
      source,
      uuid,
    });

  console.log({ connections });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, localStream]);

  if (!isInitialised) return null;

  return (
    <div>
      <j-button onClick={() => join()}>Join</j-button>
      <j-button onClick={() => toggleCamera()}>Toggle</j-button>
      <div className={grid}>
        {localStream && (
          <div className={item} data-camera-enabled={true}>
            <video
              className={video}
              ref={videoRef}
              autoPlay
              playsInline
            ></video>
            <div className={details}>
              <j-text>Me</j-text>
            </div>
          </div>
        )}
        {connections.map((peer, i) => (
          <Peer
            key={peer.did}
            did={peer.did}
            connection={peer.connection}
          ></Peer>
        ))}
      </div>
    </div>
  );
}

export default function App({ perspective, source }) {
  return (
    <>
      {perspective ? (
        <AgentProvider>
          <CommunityProvider perspectiveUuid={perspective}>
            <Channel source={source} uuid={perspective} />
          </CommunityProvider>
        </AgentProvider>
      ) : (
        <div className={styles.appContainer}>
          <AllCommunities />
        </div>
      )}
    </>
  );
}
