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

type Peer = {
  did: string;
  connection: RTCPeerConnection;
};

function useWebRTC({ source, uuid }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const manager = useRef<WebRTCManager>();
  const [connections, setConnections] = useState<Peer[]>([]);

  useEffect(() => {
    if (source && uuid && !isInitialised) {
      manager.current = new WebRTCManager({ source, uuid });

      manager.current.on(
        Event.PEER_ADDED,
        (did, connection: RTCPeerConnection) => {
          setConnections((oldConnections) => [
            ...oldConnections,
            { did, connection },
          ]);
        }
      );

      manager.current.on(Event.PEER_REMOVED, (did) => {
        const filter = connections.filter((c) => c.did !== did);
        setConnections((oldConnections) => {
          return oldConnections.filter((c) => c.did !== did);
        });
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

    connection.ontrack = (event) => {
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
    <div className={item} data-camera-enabled={true}>
      <video
        id={`user-video-${did}`}
        className={video}
        autoPlay
        playsInline
      ></video>
      <div className={details}>
        <j-text>{did}</j-text>
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
