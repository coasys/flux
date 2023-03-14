import { useRef, useEffect, useState } from "preact/hooks";
import { Me } from "utils/api/getMe";
import { WebRTC } from "../../hooks/useWebrtc";
import items from "../../sprites/items";
import Sprite from "../Sprite/Sprite";
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
      x: (event.offsetX / event.target.clientWidth) * 100,
      y: (event.offsetY / event.target.clientHeight) * 100,
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
      <div className={styles.item} data-item="bush">
        <Sprite hash={items.frames[0]} palette={items.palette} />
      </div>
      <div className={styles.item} data-item="tree">
        <Sprite hash={items.frames[1]} palette={items.palette} />
      </div>
      <div className={styles.item} data-item="barrel">
        <Sprite hash={items.frames[2]} palette={items.palette} />
      </div>
    </div>
  );
}
