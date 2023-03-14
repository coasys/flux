import { useRef, useEffect, useState } from "preact/hooks";
import { Me } from "utils/api/getMe";
import { WebRTC } from "../../hooks/useWebrtc";
import User from "../User/User";

import styles from "./UserGrid.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function UserGrid({ webRTC, currentUser }: Props) {
  const [localCoords, setLocalCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    // 👇️ Get the mouse position relative to the element
    webRTC.onChangeState({
      spriteIndex: webRTC.localState.spriteIndex,
      x:
        ((event.clientX - event.currentTarget.offsetLeft) /
          event.currentTarget.clientWidth) *
        100,
      y:
        ((event.clientY - event.currentTarget.offsetTop) /
          event.currentTarget.clientHeight) *
        100,
    });
  };

  // Build participant elements
  const peerItems = webRTC.connections
    .sort((a, b) => a.did.localeCompare(b.did))
    .map((peer) => {
      return (
        <div
          key={peer.did}
          className={styles.user}
          data-me={false}
          style={{ top: `${peer.state.y}%`, left: `${peer.state.x}%` }}
        >
          <User
            webRTC={webRTC}
            userId={peer.did}
            spriteIndex={peer.state.spriteIndex}
          />
        </div>
      );
    });

  return (
    <div className={styles.map} onMouseMove={handleMouseMove}>
      <div
        className={styles.user}
        style={{
          top: `${webRTC.localState.y}%`,
          left: `${webRTC.localState.x}%`,
        }}
      >
        <User
          webRTC={webRTC}
          userId={currentUser?.did}
          spriteIndex={webRTC.localState.spriteIndex}
          isLocalUser
        />
      </div>
      {peerItems}
    </div>
  );
}
