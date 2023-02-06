import { useEffect, useState, useRef } from "preact/hooks";
import { CommunityProvider, AgentProvider } from "utils/react";
import AllCommunities from "./components/AllCommunities";
import WebRTCManager, { Event } from "./WebRTCManager";
//import Channel from "./components/Channel-new";

import styles from "./App.module.css";

function useWebRTC({ source, uuid }) {
  const [isInitialised, setIsInitialised] = useState(false);
  const manager = useRef<WebRTCManager>();
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (source && uuid && !manager.current) {
      manager.current = new WebRTCManager({ source, uuid });

      const remoteStream = new MediaStream();

      manager.current.on(Event.PEER_ADDED, (did, connection) => {
        connection.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });

          const videElement = document.getElementById(
            `user-video-${did}`
          ) as HTMLVideoElement;

          if (videElement) {
            videElement.srcObject = remoteStream;
          }
        };

        setConnections([...connections, { did, connection }]);
      });

      manager.current.on(Event.PEER_REMOVED, (did) => {
        const filter = connections.filter((c) => c.did !== did);
        setConnections(filter);
      });

      setIsInitialised(true);
    }
  }, [source, uuid]);

  return { connections, isInitialised, join: () => manager.current?.join() };
}

function Channel({ source, uuid }) {
  const { connections, join, isInitialised } = useWebRTC({ source, uuid });

  if (!isInitialised) return null;

  return (
    <div>
      <j-button onClick={() => join()}>Join</j-button>
      {connections.map((connection, i) => (
        <div>
          <div>{i}</div>
          <video id={`user-video-${connection.did}`}></video>
        </div>
      ))}
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
