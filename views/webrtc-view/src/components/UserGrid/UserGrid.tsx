import { useRef, useEffect, useState } from "preact/hooks";
import { Howl } from "howler";
import { Me } from "utils/api/getMe";
import { Peer, Reaction } from "../../types";
import { Settings } from "../../WebRTCManager";
import Item from "./Item";
import popWav from "../../assets/pop.wav";
import guitarWav from "../../assets/guitar.wav";
import kissWav from "../../assets/kiss.wav";

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
  const [focusedPeerId, setFocusedPeerId] = useState(null);

  const popSound = new Howl({
    src: [popWav],
  });
  const guitarSound = new Howl({
    src: [guitarWav],
  });
  const kissSound = new Howl({
    src: [kissWav],
  });

  const userCount = peers.length + (localStream ? 1 : 0);
  const myReaction =
    currentReaction && currentReaction.did === currentUser.did
      ? currentReaction
      : null;

  // Grid sizing
  let gridCol = userCount === 1 ? 1 : userCount <= 4 ? 2 : 4;
  const gridColSize = userCount <= 4 ? 1 : 2;
  let gridRowSize = userCount <= 4 ? userCount : Math.ceil(userCount / 2);

  if (focusedPeerId) {
    gridCol = 1;
    gridRowSize = 2;
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, localStream]);

  useEffect(() => {
    if (reactions.length < 1) {
      return;
    }

    const newReaction = reactions[reactions.length - 1];

    if (newReaction.reaction === "💋" || newReaction.reaction === "😘") {
      kissSound.play();
    } else if (newReaction.reaction === "🎸") {
      guitarSound.play();
    } else {
      popSound.play();
    }

    setCurrentReaction(newReaction);
    const timeOutId = setTimeout(() => setCurrentReaction(null), 3500);
    return () => clearTimeout(timeOutId);
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
        focused={focusedPeerId === peer.did}
        minimised={focusedPeerId && focusedPeerId !== peer.did}
        onToggleFocus={() =>
          setFocusedPeerId(focusedPeerId === peer.did ? null : peer.did)
        }
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
          focused={focusedPeerId === currentUser.did}
          minimised={focusedPeerId && focusedPeerId !== currentUser.did}
          onToggleFocus={() =>
            setFocusedPeerId(
              focusedPeerId === currentUser.did ? null : currentUser.did
            )
          }
        />
      )}
      {peerItems}
    </div>
  );
}
