import { useEffect, useRef, useState } from "preact/hooks";
import { Profile } from "utils/types";
import { getProfile } from "utils/api";
import { Me } from "utils/api";
import { WebRTC } from "../../hooks/useWebrtc";

import styles from "./JoinScreen.module.css";
import Disclaimer from "../Disclaimer";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
  onToggleSettings: () => void;
};

export default function JoinScreen({
  webRTC,
  currentUser,
  onToggleSettings,
}: Props) {
  const videoRef = useRef(null);
  const [profile, setProfile] = useState<Profile>();

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(currentUser?.did);
      setProfile(profileResponse);
    }

    if (!profile && currentUser) {
      fetchAgent();
    }
  }, [profile, currentUser]);

  useEffect(() => {
    if (videoRef.current && webRTC.localStream) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, webRTC.localStream]);

  return (
    <j-flex a="center" direction="column">
      <h1>You haven't joined this room</h1>

      <j-text variant="body">Your microphone will be enabled.</j-text>

      <j-box pt="200">
        <div
          className={styles.preview}
          data-camera-enabled={!!webRTC.settings.video}
          data-mirrored={true}
        >
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
          ></video>

          <div className={styles.details}>
            <div className={styles.avatar}>
              <>
                {currentUser && profile && (
                  <j-avatar
                    initials={profile ? profile.username?.charAt(0) : "?"}
                    hash={currentUser ? currentUser?.did : "?"}
                    size="xl"
                  ></j-avatar>
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
                <j-button
                  variant="secondary"
                  onClick={onToggleSettings}
                  square
                  circle
                  size="lg"
                >
                  <j-icon name="gear"></j-icon>
                </j-button>
              </j-tooltip>
            </div>
          </div>
        </div>
      </j-box>

      <j-box pt="400">
        <j-toggle
          checked={webRTC.settings.video}
          disabled={
            webRTC.isLoading ||
            !webRTC.permissionGranted ||
            webRTC.devices.every((d) => d.kind !== "videoinput")
          }
          onChange={() =>
            webRTC.onChangeSettings({
              ...webRTC.settings,
              video: !webRTC.settings.video,
            })
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
          disabled={!webRTC.permissionGranted}
          onClick={webRTC.onJoin}
        >
          Join room!
        </j-button>
      </j-box>

      <j-box pt="400">
        <Disclaimer />
      </j-box>

      <>
        {!webRTC.permissionGranted && (
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
