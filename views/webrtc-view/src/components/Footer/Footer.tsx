import { useEffect, useRef } from "preact/hooks";
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
  const emojiPicker = useRef();

  useEffect(() => {
    if (emojiPicker.current) {
      emojiPicker.current.addEventListener("emoji-click", onEmojiClick);
    }

    return () => {
      if (emojiPicker.current) {
        emojiPicker.current.removeEventListener("emoji-click", onEmojiClick);
      }
    };
  }, [emojiPicker.current]);

  const onEmojiClick = (event) => {
    onReaction(event.detail.unicode);
    if (emojiPicker.current) {
      // emojiPicker.current.close();
    }
  };

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
          title={settings.audio ? "Mute microphone" : "Unmute microphone"}
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

        <j-tooltip
          placement="auto"
          title={settings.screen ? "Stop sharing" : "Share screen"}
        >
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

        <j-popover placement="top">
          <j-tooltip slot="trigger" placement="top" title="Send reaction">
            <j-button
              variant="transparent"
              square
              circle
              disabled={!hasJoined}
              size="lg"
            >
              <j-icon name="emoji-neutral"></j-icon>
            </j-button>
          </j-tooltip>
          <div slot="content">
            <emoji-picker class={styles.picker} ref={emojiPicker} />
          </div>
        </j-popover>

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
