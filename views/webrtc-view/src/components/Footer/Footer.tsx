import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";
import { Settings } from "../../WebRTCManager";

import styles from "./Footer.module.css";

type Props = {
  settings: Settings;
  hasJoined: boolean;
  onChangeSettings: (newSettings: Settings) => void;
  onToggleDebug: () => void;
  onReaction: (reaction: string) => void;
  onLeave: () => void;
};

export default function Footer({
  settings,
  hasJoined,
  onChangeSettings,
  onToggleDebug,
  onReaction,
  onLeave,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-tooltip
          placement="auto"
          title={settings.video ? "Disable camera" : "Enable camera"}
        >
          <j-button
            variant={settings.video ? "primary" : "secondary"}
            onClick={() =>
              onChangeSettings({ ...settings, video: !settings.video })
            }
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            <j-icon
              name={settings.video ? "camera-video-off" : "camera-video"}
            ></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="auto"
          title={settings.audio ? "Mute microphone" : "unmute microphone"}
        >
          <j-button
            variant={settings.audio ? "primary" : "secondary"}
            onClick={() =>
              onChangeSettings({ ...settings, audio: !settings.audio })
            }
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            <j-icon name={settings.audio ? "mic-mute" : "mic"}></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip placement="auto" title="Share screen">
          <j-button
            variant={settings.screen ? "primary" : "secondary"}
            onClick={() =>
              onChangeSettings({ ...settings, screen: !settings.screen })
            }
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            <j-icon name="display"></j-icon>
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
        {/* 
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
        </j-tooltip> */}

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
