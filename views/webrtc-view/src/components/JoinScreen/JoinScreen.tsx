import { WebRTC } from "@coasys/flux-react-web";
import { Profile } from "@coasys/flux-types";
import { useEffect, useRef } from "preact/hooks";

import Avatar from "../Avatar";
import Disclaimer from "../Disclaimer";
import styles from "./JoinScreen.module.scss";

type Props = {
  webRTC: WebRTC;
  profile?: Profile;
  onToggleSettings: () => void;
  did?: string;
  currentView: string;
};

export default function JoinScreen({
  webRTC,
  profile,
  onToggleSettings,
  did,
  currentView,
}: Props) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && webRTC.localStream) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, webRTC.localStream]);

  return (
    <j-flex
      a="center"
      direction="column"
      style={{
        width:
          currentView === "@coasys/flux-synergy-demo-view" ? "100%" : undefined,
      }}
    >
      <h1>You haven't joined this room</h1>

      <j-text variant="body">Your microphone will be enabled.</j-text>

      <j-box
        pt="200"
        style={{
          width:
            currentView === "@coasys/flux-synergy-demo-view"
              ? "100%"
              : undefined,
        }}
      >
        <div
          className={`${styles.preview} ${currentView === "@coasys/flux-synergy-demo-view" && styles.synergy}`}
          data-camera-enabled={!!webRTC.localState.settings.video}
          data-mirrored={true}
        >
          <video ref={videoRef} className={styles.video} autoPlay playsInline />

          <div className={styles.details}>
            <div className={styles.avatar}>
              <>
                {profile && (
                  <Avatar
                    initials={profile?.username?.charAt(0) || "?"}
                    size="xl"
                    profileAddress={profile?.profileThumbnailPicture}
                    hash={did}
                  />
                )}
              </>
            </div>
          </div>

          <div className={styles.username}>
            <span>{profile?.username || "Unknown user"}</span>
          </div>

          <div className={styles.loading}>
            <j-spinner size="lg"></j-spinner>
            <j-text>{profile?.username} connecting...</j-text>
          </div>

          <div className={styles.settings}>
            <div>
              <j-tooltip placement="top" title="Settings">
                <j-button onClick={onToggleSettings} square circle size="lg">
                  <j-icon name="gear"></j-icon>
                </j-button>
              </j-tooltip>
            </div>
          </div>
        </div>
      </j-box>

      <j-box pt="400">
        <j-toggle
          checked={webRTC.localState.settings.video ? true : false}
          disabled={
            webRTC.isLoading ||
            !webRTC.audioPermissionGranted ||
            webRTC.devices.every((d) => d.kind !== "videoinput")
          }
          onChange={() =>
            webRTC.onToggleCamera(!webRTC.localState.settings.video)
          }
        >
          Join with camera!
        </j-toggle>
      </j-box>

      <j-box pt="500">
        <j-button
          variant="primary"
          size="lg"
          loading={webRTC.isLoading}
          disabled={!webRTC.audioPermissionGranted}
          onClick={webRTC.onJoin}
        >
          Join room!
        </j-button>
      </j-box>

      {currentView === "@coasys/flux-webrtc-view" && (
        <j-box pt="400">
          <Disclaimer />
        </j-box>
      )}

      <>
        {!webRTC.audioPermissionGranted && (
          <j-box pt="400">
            <j-text variant="warning">
              Please allow camera/microphone access to join.
            </j-text>
          </j-box>
        )}
      </>
    </j-flex>
  );
}
