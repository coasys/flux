import { useContext, useEffect, useRef } from "preact/hooks";
import UiContext from "../../context/UiContext";
import { WebRTC } from "@fluxapp/react-web";

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

  const popOver = useRef();

  const onEmojiClick = (event) => {
    webRTC.onReaction(event.detail.native);
    if (popOver.current) {
      popOver.current?.removeAttribute("open");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-tooltip
          placement="top"
          title={
            webRTC.localState.settings.video
              ? "Disable camera"
              : "Enable camera"
          }
        >
          <j-button
            variant={webRTC.localState.settings.video ? "secondary" : "primary"}
            onClick={() =>
              webRTC.onToggleCamera(!webRTC.localState.settings.video)
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
              name={
                webRTC.localState.settings.video
                  ? "camera-video"
                  : "camera-video-off"
              }
            ></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={
            webRTC.localState.settings.audio
              ? "Mute microphone"
              : "Unmute microphone"
          }
        >
          <j-button
            variant={webRTC.localState.settings.audio ? "secondary" : "primary"}
            onClick={() =>
              webRTC.onToggleAudio(!webRTC.localState.settings.audio)
            }
            square
            circle
            size="lg"
            disabled={!webRTC.hasJoined}
          >
            <j-icon
              name={webRTC.localState.settings.audio ? "mic" : "mic-mute"}
            ></j-icon>
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={
            webRTC.localState.settings.screen ? "Stop sharing" : "Share screen"
          }
        >
          <j-button
            variant={
              webRTC.localState.settings.screen ? "primary" : "secondary"
            }
            onClick={() =>
              webRTC.onToggleScreenShare(!webRTC.localState.settings.screen)
            }
            square
            circle
            size="lg"
            disabled={!webRTC.hasJoined}
          >
            <j-icon name="display"></j-icon>
          </j-button>
        </j-tooltip>

        <j-popover ref={popOver} placement="top">
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
            <j-emoji-picker
              className={styles.picker}
              onclickoutside={() => {}}
              onChange={onEmojiClick}
            ></j-emoji-picker>
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
