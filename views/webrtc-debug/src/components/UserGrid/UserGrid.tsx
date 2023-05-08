import { useRef, useEffect, useState, useLayoutEffect } from "preact/hooks";
import { Me } from "@fluxapp/api";
import useContextMenu from "../../hooks/useContextMenu";
import { WebRTC } from "utils/react-web";
import items from "../../sprites/items";
import Canvas from "../Canvas";
import Sprite from "../Sprite/Sprite";
import User from "../User/User";

import styles from "./UserGrid.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function UserGrid({ webRTC, currentUser }: Props) {
  const [canvasSize, setCanvasSize] = useState([0, 0]);

  useLayoutEffect(() => {
    function updateSize() {
      const el = document.getElementById("map");

      if (el) {
        setCanvasSize([el.clientWidth, el.clientHeight]);
      }
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMouseMove = (event) => {
    webRTC.onChangeState({
      ...webRTC.localState,
      x: (event.offsetX / event.target.clientWidth) * 100,
      y: (event.offsetY / event.target.clientHeight) * 100,
    });
  };

  const handleMouseDown = () => {
    webRTC.onChangeState({
      ...webRTC.localState,
      isDrawing: true,
    });
  };

  const handleMouseUp = () => {
    webRTC.onChangeState({
      ...webRTC.localState,
      isDrawing: false,
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
          style={{ top: `${peer?.state?.y}%`, left: `${peer?.state?.x}%` }}
        >
          <User
            webRTC={webRTC}
            userId={peer.did}
            isDrawing={peer?.state?.isDrawing}
            spriteIndex={peer?.state?.spriteIndex || 0}
          />
        </div>
      );
    });

  return (
    <div
      id="map"
      className={styles.map}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
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
          isDrawing={webRTC.localState.isDrawing}
          spriteIndex={webRTC.localState.spriteIndex || 0}
          isLocalUser
        />
      </div>

      <div className={styles.canvas}>
        <Canvas
          peers={webRTC.connections}
          width={canvasSize[0]}
          height={canvasSize[1]}
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
      <div className={styles.item} data-item="chair">
        <Sprite hash={items.frames[3]} palette={items.palette} />
      </div>
      <div className={styles.item} data-item="rat">
        <Sprite hash={items.frames[4]} palette={items.palette} />
      </div>

      <div className={styles.footer}>
        <j-text variant="body" nomargin>
          Keyboard shortcuts:
        </j-text>
        <j-badge>
          <span className={styles.key}>D</span> toggle debug
        </j-badge>
      </div>
    </div>
  );
}
