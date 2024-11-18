import { WebRTC } from "@coasys/flux-react-web";
import { useContext, useRef } from "preact/hooks";
import UiContext from "../../context/UiContext";
import styles from "./Footer.module.css";

type Props = {
  webRTC: WebRTC;
  onToggleSettings: () => void;
};

function transcriptionSVG(on: boolean) {
  if (on)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        fill="var(--j-color-primary-600)"
        className="bi bi-type"
        viewBox="0 0 16 16"
      >
        <path d="M 2.244,12.681 3.187,9.878 H 6.66 l 0.944,2.803 H 8.86 L 5.54,3.35 H 4.322 L 1,12.681 Z M 4.944,4.758 6.34,8.914 H 3.51 l 1.4,-4.156 z m 9.146,7.027 h 0.035 v 0.896 h 1.128 V 7.725 c 0,-1.51 -1.114,-2.345 -2.646,-2.345 -1.736,0 -2.59,0.916 -2.666,2.174 h 1.108 c 0.068,-0.718 0.595,-1.19 1.517,-1.19 0.971,0 1.518,0.52 1.518,1.464 V 8.559 H 12.19 c -1.647,0.007 -2.522,0.8 -2.522,2.058 0,1.319 0.957,2.18 2.345,2.18 1.06,0 1.716,-0.43 2.078,-1.011 z m -1.763,0.035 c -0.752,0 -1.456,-0.397 -1.456,-1.244 0,-0.65 0.424,-1.115 1.408,-1.115 h 1.805 v 0.834 c 0,0.896 -0.752,1.525 -1.757,1.525" />
      </svg>
    );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="26"
      fill="000"
      className="bi bi-type"
      viewBox="0 0 16 16"
    >
      <path d="M 12.607422 5.3808594 C 10.871424 5.3808594 10.017406 6.2966888 9.9414062 7.5546875 L 11.048828 7.5546875 C 11.116828 6.8366882 11.644407 6.3632812 12.566406 6.3632812 C 13.537405 6.3632812 14.083984 6.8841259 14.083984 7.828125 L 14.083984 8.5585938 L 12.189453 8.5585938 C 11.72128 8.5605836 11.32347 8.6322675 10.982422 8.7539062 L 11.75 9.5214844 C 11.905681 9.4849042 12.077836 9.4609375 12.279297 9.4609375 L 14.083984 9.4609375 L 14.083984 10.294922 C 14.083984 10.732791 13.902511 11.104958 13.601562 11.373047 L 14.058594 11.830078 C 14.068779 11.814645 14.082041 11.800814 14.091797 11.785156 L 14.125 11.785156 L 14.125 11.896484 L 14.910156 12.681641 L 15.253906 12.681641 L 15.253906 7.7246094 C 15.253906 6.2146109 14.13942 5.3808594 12.607422 5.3808594 z M 3.4824219 5.7109375 L 1 12.681641 L 2.2441406 12.681641 L 3.1875 9.8789062 L 6.6601562 9.8789062 L 7.6035156 12.681641 L 8.859375 12.681641 L 7.9785156 10.207031 L 6.1640625 8.3925781 L 6.3398438 8.9140625 L 3.5097656 8.9140625 L 4.3105469 6.5390625 L 3.4824219 5.7109375 z" />
      <path d="m 1.7879982,2.4928069 11.9999998,12.0000001 0.708,-0.708 -11.9999998,-12 z" />
    </svg>
  );
}

export default function Footer({ webRTC, onToggleSettings }: Props) {
  const {
    hasJoined,
    localState,
    devices,
    onReaction,
    onToggleCamera,
    onToggleAudio,
    updateTranscriptionSetting,
    onToggleScreenShare,
    onLeave,
  } = webRTC;
  const { video, audio, transcriber, screen } = localState.settings;
  const {
    state: { showSettings },
    methods: { toggleShowSettings },
  } = useContext(UiContext);

  const popOver = useRef();

  const onEmojiClick = (event) => {
    onReaction(event.detail.native);
    if (popOver.current) popOver.current?.removeAttribute("open");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-tooltip
          placement="top"
          title={video ? "Disable camera" : "Enable camera"}
        >
          <j-button
            variant={video ? "secondary" : "primary"}
            onClick={() => onToggleCamera(!video)}
            square
            circle
            size="lg"
            disabled={
              !hasJoined || devices.every((d) => d.kind !== "videoinput")
            }
          >
            <j-icon name={video ? "camera-video" : "camera-video-off"} />
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={audio ? "Mute microphone" : "Unmute microphone"}
        >
          <j-button
            variant={audio ? "secondary" : "primary"}
            onClick={() => onToggleAudio(!audio)}
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            <j-icon name={audio ? "mic" : "mic-mute"} />
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={
            transcriber.on ? "Disable transcription" : "Enable transcription"
          }
        >
          <j-button
            variant={transcriber.on ? "secondary" : "primary"}
            onClick={() => updateTranscriptionSetting("on", !transcriber.on)}
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            {transcriptionSVG(transcriber.on)}
          </j-button>
        </j-tooltip>

        <j-tooltip
          placement="top"
          title={screen ? "Stop sharing" : "Share screen"}
        >
          <j-button
            variant={screen ? "primary" : "secondary"}
            onClick={() => onToggleScreenShare(!screen)}
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            <j-icon name="display" />
          </j-button>
        </j-tooltip>

        <j-popover ref={popOver} placement="top">
          <j-tooltip slot="trigger" placement="top" title="Send reaction">
            <j-button
              variant="transparent"
              square
              circle
              disabled={!hasJoined}
              size="lg"
            >
              <j-icon name="emoji-neutral" />
            </j-button>
          </j-tooltip>
          <div slot="content">
            <j-emoji-picker className={styles.picker} onChange={onEmojiClick} />
          </div>
        </j-popover>

        <j-tooltip placement="top" title="Leave">
          <j-button
            variant="danger"
            onClick={onLeave}
            square
            circle
            size="lg"
            disabled={!hasJoined}
          >
            <j-icon name="telephone-x" />
          </j-button>
        </j-tooltip>

        <j-tooltip placement="top" title="Debug">
          <j-button
            variant="secondary"
            onClick={onToggleSettings}
            square
            circle
            size="lg"
          >
            <j-icon name="gear" />
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
            <j-icon name="stars" />
          </j-button>
        </j-tooltip> */}
      </div>

      {/* <div className={styles.debug}>
        <j-tooltip placement="top" title="Debug">
          <j-button
            variant="secondary"
            onClick={() => onToggleSettings(!showSettings)}
            square
            circle
            size="lg"
          >
            <j-icon name="gear" />
          </j-button>
        </j-tooltip>
      </div> */}
    </div>
  );
}
