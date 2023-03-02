import { useRef, useEffect, useState } from "preact/hooks";
import { Howl } from "howler";
import { Me } from "utils/api/getMe";
import { Reaction } from "../../types";
import { WebRTC } from "../../hooks/useWebrtc";
import popWav from "../../assets/pop.wav";
import guitarWav from "../../assets/guitar.wav";
import kissWav from "../../assets/kiss.wav";
import pigWav from "../../assets/pig.wav";
import Item from "./Item";

import styles from "./UserGrid.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function UserGrid({ webRTC, currentUser }: Props) {
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
  const pigSound = new Howl({
    src: [pigWav],
  });

  const userCount = webRTC.connections.length + (webRTC.localStream ? 1 : 0);
  const myReaction =
    currentReaction && currentReaction.did === currentUser.did
      ? currentReaction
      : null;

  // Grid sizing

  const gridColSize = focusedPeerId
    ? 1
    : userCount === 1
    ? 1
    : userCount > 1 && userCount <= 4
    ? 2
    : userCount > 4 && userCount <= 9
    ? 3
    : 4;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, webRTC.localStream]);

  useEffect(() => {
    if (webRTC.reactions.length < 1) {
      return;
    }

    const newReaction = webRTC.reactions[webRTC.reactions.length - 1];

    if (newReaction.reaction === "💋" || newReaction.reaction === "😘") {
      kissSound.play();
    } else if (newReaction.reaction === "🎸") {
      guitarSound.play();
    } else if (newReaction.reaction === "🐷" || newReaction.reaction === "🐖") {
      pigSound.play();
    } else {
      popSound.play();
    }

    setCurrentReaction(newReaction);
    const timeOutId = setTimeout(() => setCurrentReaction(null), 3500);
    return () => clearTimeout(timeOutId);
  }, [webRTC.reactions]);

  // Build participant elements
  const peerItems = webRTC.connections
    .sort((a, b) => a.did.localeCompare(b.did))
    .map((peer, index) => {
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
          peer={peer}
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
        "--grid-col-size": gridColSize,
      }}
    >
      {webRTC.localStream && (
        <Item
          isMe
          mirrored={webRTC.settings.video && !webRTC.settings.screen}
          userId={currentUser.did}
          videoRef={videoRef}
          settings={webRTC.settings}
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
