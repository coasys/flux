import { useState } from "preact/hooks";
import { Profile } from "@coasys/flux-types";
import { WebRTC } from "@coasys/flux-react-web";

import Debug from "./Debug";
import VoiceVideo from "./VoiceVideo";
import Connection from "./Connection";

import styles from "./Settings.module.css";

type Props = {
  webRTC: WebRTC;
  profile?: Profile;
};

export default function Settings({ webRTC, profile }: Props) {
  const [currentTab, setCurrentTab] = useState("voice-video");

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
          <j-menu-item
            selected={currentTab === "connection"}
            onClick={() => setCurrentTab("connection")}
          >
            Connection
          </j-menu-item>
          <j-menu-item
            selected={currentTab === "debug"}
            onClick={() => setCurrentTab("debug")}
          >
            Debug
          </j-menu-item>
        </j-menu-group-item>
      </div>

      <div className={styles.contents}>
        <>{currentTab === "voice-video" && <VoiceVideo webRTC={webRTC} />}</>
        <>{currentTab === "connection" && <Connection webRTC={webRTC} />}</>
        <>
          {currentTab === "debug" && (
            <Debug webRTC={webRTC} profile={profile} />
          )}
        </>
      </div>
    </div>
  );
}
