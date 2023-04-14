import { useEffect, useRef, useState } from "preact/hooks";
import { Me } from "utils/api";
import { WebRTC } from "utils/frameworks/react";

import VoiceVideo from "./VoiceVideo";

import styles from "./Settings.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function Settings({ webRTC, currentUser }: Props) {
  const [currentTab, setCurrentTab] = useState("voice-video");
  const test = (event) => {
    // test
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.menu}>
        <j-menu-group-item title="Settings">
          <j-menu-item
            selected={currentTab === "voice-video"}
            onClick={() => setCurrentTab("voice-video")}
          >
            Voice & Video
          </j-menu-item>
        </j-menu-group-item>
      </div>

      <div className={styles.contents}>
        <>
          {currentTab === "voice-video" && (
            <VoiceVideo webRTC={webRTC} currentUser={currentUser} />
          )}
        </>
      </div>
    </div>
  );
}
