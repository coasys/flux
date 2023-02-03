import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";

import styles from "./Footer.module.css";

export default function Footer({
  localStream,
  currentUser,
  onToggleCamera,
  onToggleScreen,
  onToggleDebug,
  onLeave,
}) {
  const cameraEnabled = currentUser && currentUser.prefrences.video;

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-tooltip
          placement="auto"
          title={cameraEnabled ? "Disable camera" : "Enable camera"}
        >
          <j-button
            variant={cameraEnabled ? "primary" : "secondary"}
            onClick={onToggleCamera}
            square
            circle
            size="lg"
            disabled={!localStream}
          >
            <j-icon
              name={cameraEnabled ? "camera-video-off" : "camera-video"}
            ></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="auto" title="Share screen">
          <j-button
            variant="secondary"
            onClick={onToggleScreen}
            square
            circle
            size="lg"
            disabled={!localStream}
          >
            <j-icon name="display"></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="auto" title="Leave">
          <j-button
            variant="secondary"
            onClick={onLeave}
            square
            circle
            size="lg"
            disabled={!localStream}
          >
            <j-icon name="door-closed"></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="top" title="Debug">
          <j-button
            variant="transparent"
            onClick={onToggleDebug}
            square
            circle
            size="lg"
          >
            <j-icon name="info"></j-icon>
          </j-button>
        </j-tooltip>
      </div>
    </div>
  );
}
