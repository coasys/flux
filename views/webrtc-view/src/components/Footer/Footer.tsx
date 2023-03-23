import { useContext, useEffect, useRef } from "preact/hooks";
import UiContext from "../../context/UiContext";
import { WebRTC } from "../../hooks/useWebrtc";

import styles from "./Footer.module.css";

type Props = {
  webRTC: WebRTC;
  onToggleSettings: () => void;
};

export default function Footer({ webRTC, onToggleSettings }: Props) {
  const {
    state: { showSettings },
    methods: { toggleShowSettings },
  } = useContext(UiContext);

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
    webRTC.onReaction(event.detail.unicode);
    if (emojiPicker.current) {
      // emojiPicker.current.close();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-tooltip
          placement="top"
          title={webRTC.settings.video ? "Disable camera" : "Enable camera"}
        >
          <j-button
            variant={webRTC.settings.video ? "secondary" : "primary"}
            onClick={() =>
              webRTC.onChangeSettings({
                ...webRTC.settings,
                video: !webRTC.settings.video,
              })
            }
            square
            circle
            size="lg"
            disabled={
              !webRTC.hasJoined ||
              webRTC.devices.every((d) => d.kind !== "videoinput")
            }
          >
            <j-icon
              name={webRTC.settings.video ? "camera-video" : "camera-video-off"}
            ></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={
            webRTC.settings.audio ? "Mute microphone" : "Unmute microphone"
          }
        >
          <j-button
            variant={webRTC.settings.audio ? "secondary" : "primary"}
            onClick={() =>
              webRTC.onChangeSettings({
                ...webRTC.settings,
                audio: !webRTC.settings.audio,
              })
            }
            square
            circle
            size="lg"
            disabled={!webRTC.hasJoined}
          >
            <j-icon name={webRTC.settings.audio ? "mic" : "mic-mute"}></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={webRTC.settings.screen ? "Stop sharing" : "Share screen"}
        >
          <j-button
            variant={webRTC.settings.screen ? "primary" : "secondary"}
            onClick={() =>
              webRTC.onChangeSettings({
                ...webRTC.settings,
                screen: !webRTC.settings.screen,
              })
            }
            square
            circle
            size="lg"
            disabled={!webRTC.hasJoined}
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
              disabled={!webRTC.hasJoined}
              size="lg"
            >
              <j-icon name="emoji-neutral"></j-icon>
            </j-button>
          </j-tooltip>
          <div slot="content">
            <emoji-picker class={styles.picker} ref={emojiPicker} />
          </div>
        </j-popover>

        <j-tooltip placement="top" title="Leave">
          <j-button
            variant="danger"
            onClick={webRTC.onLeave}
            square
            circle
            size="lg"
            disabled={!webRTC.hasJoined}
          >
            <j-icon name="telephone-x"></j-icon>
          </j-button>
        </j-tooltip>
        {/* 
        <j-tooltip placement="top" title="Experiments">
          <j-button
            variant="transparent"
            onClick={onToggleDebug}
            square
            circle
            disabled={!webRTC.hasJoined}
            size="lg"
          >
            <j-icon name="stars"></j-icon>
          </j-button>
        </j-tooltip> */}
      </div>

      <div className={styles.debug}>
        <j-tooltip placement="top" title="Debug">
          <j-button
            variant="secondary"
            onClick={() => onToggleSettings(!showSettings)}
            square
            circle
            size="lg"
          >
            <j-icon name="gear"></j-icon>
          </j-button>
        </j-tooltip>
      </div>
    </div>
  );
}
