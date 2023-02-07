import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";

import styles from "./Footer.module.css";

export default function Footer({
  hasJoined,
  // currentUser,
  onToggleCamera,
  // onToggleScreen,
  onToggleDebug,
  onReaction,
  onLeave,
}) {
  // const cameraEnabled = currentUser && currentUser.prefrences.video;
  const cameraEnabled = true;

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
            disabled={!hasJoined}
          >
            <j-icon
              name={cameraEnabled ? "camera-video-off" : "camera-video"}
            ></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="auto" title="Share screen">
          <j-button
            variant="secondary"
            // onClick={onToggleScreen}
            square
            circle
            size="lg"
            disabled={!hasJoined}
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
            disabled={!hasJoined}
          >
            <j-icon name="door-closed"></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="top" title="Send like">
          <j-button
            variant="transparent"
            onClick={() => onReaction("like")}
            square
            circle
            disabled={!hasJoined}
            size="lg"
          >
            <j-icon name="hand-thumbs-up"></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="top" title="Send dislike">
          <j-button
            variant="transparent"
            onClick={() => onReaction("dislike")}
            square
            circle
            disabled={!hasJoined}
            size="lg"
          >
            <j-icon name="hand-thumbs-down"></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="top" title="Experiments">
          <j-button
            variant="transparent"
            onClick={onToggleDebug}
            square
            circle
            disabled={!hasJoined}
            size="lg"
          >
            <j-icon name="stars"></j-icon>
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
