import { useRef, useEffect, useState } from "preact/hooks";
import { Me } from "utils/api/getMe";
import { Peer, Reaction } from "../../types";
import { Settings } from "../../WebRTCManager";
import Item from "./Item";

import styles from "./UserGrid.module.css";

type Props = {
  currentUser?: Me;
  localStream: MediaStream;
  settings: Settings;
  peers: Peer[];
  reactions: Reaction[];
};

export default function UserGrid({
  currentUser,
  localStream,
  settings,
  peers,
  reactions,
}: Props) {
  const videoRef = useRef(null);
  const [currentReaction, setCurrentReaction] = useState<Reaction>(null);

  const userCount = peers.length + (localStream ? 1 : 0);
  const myReaction =
    currentReaction && currentReaction.did === currentUser.did
      ? currentReaction
      : null;

  // Grid sizing
  let gridCol = userCount === 1 ? 1 : userCount <= 4 ? 2 : 4;
  const gridColSize = userCount <= 4 ? 1 : 2;
  let gridRowSize = userCount <= 4 ? userCount : Math.ceil(userCount / 2);

  // if (screenPresenter) {
  //   gridCol = 1;
  //   gridRowSize = 2;
  // }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, localStream]);

  useEffect(() => {
    if (reactions.length > 0) {
      setCurrentReaction(reactions[reactions.length - 1]);

      setTimeout(() => {
        setCurrentReaction(null);
      }, 3500);
    }
  }, [reactions]);

  // Build participant elements
  const peerItems = peers.map((peer, index) => {
    const remoteStream = new MediaStream();
    const peerReaction =
      currentReaction && currentReaction.did === peer.did
        ? currentReaction
        : null;

    if (peer.connection.peerConnection) {
      peer.connection.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        const videElement = document.getElementById(
          `user-video-${peer.did}`
        ) as HTMLVideoElement;

        if (videElement) {
          videElement.srcObject = remoteStream;
        }
      };
    }

    return (
      <Item
        key={peer.did}
        userId={peer.did}
        settings={peer.settings}
        reaction={peerReaction}
      />
    );
  });

  return (
    <div
      className={styles.grid}
      style={{
        "--grid-size": gridCol,
        "--grid-col-size": gridColSize,
        "--grid-row-size": gridRowSize,
      }}
    >
      {localStream && (
        <Item
          userId={currentUser.did}
          videoRef={videoRef}
          settings={settings}
          reaction={myReaction}
        />
      )}
      {peerItems}
    </div>
  );
}
