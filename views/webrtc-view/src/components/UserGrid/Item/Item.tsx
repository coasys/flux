import { useState, useEffect } from "preact/hooks";
import { Peer, Reaction } from "../../../types";
import { Settings } from "../../../WebRTCManager";
import { Profile } from "utils/types";
import { getProfile } from "utils/api";

import styles from "./Item.module.css";

type Props = {
  isMe?: boolean;
  userId: string;
  settings?: Settings;
  reaction?: Reaction;
  mirrored?: boolean;
  focused?: boolean;
  minimised?: boolean;
  peer?: Peer;
  videoRef?: React.MutableRefObject<null>;
  onToggleFocus: () => void;
};

export default function Item({
  isMe,
  userId,
  settings,
  focused,
  minimised,
  reaction,
  mirrored,
  peer,
  videoRef,
  onToggleFocus,
}: Props) {
  const [profile, setProfile] = useState<Profile>();
  const [isConnecting, setIsConnecting] = useState(false);

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(userId);
      setProfile(profileResponse);
    }

    if (!profile) {
      fetchAgent();
    }
  }, [profile, userId]);

  // Get loading state
  useEffect(() => {
    if (isMe) return;

    if (peer?.connection.peerConnection.iceConnectionState === "connected") {
      setIsConnecting(false);
    } else {
      setIsConnecting(true);
    }

    function updateLoadingState(event) {
      if (event.target.iceConnectionState === "connected") {
        console.log("connection is", event.target.iceConnectionState);
        setIsConnecting(false);
      }
    }

    peer?.connection.peerConnection.addEventListener(
      "iceconnectionstatechange",
      updateLoadingState
    );

    return () => {
      if (peer) {
        peer.connection.peerConnection.removeEventListener(
          "iceconnectionstatechange",
          updateLoadingState
        );
      }
    };
  }, [peer]);

  return (
    <div
      className={styles.item}
      data-camera-enabled={settings.video}
      data-focused={focused}
      data-minimised={minimised}
      data-mirrored={mirrored}
      data-connecting={isConnecting}
    >
      <video
        ref={videoRef}
        className={styles.video}
        id={`user-video-${userId}`}
        autoPlay
        playsInline
      ></video>

      <div className={styles.details} onClick={onToggleFocus}>
        {profile?.username && (
          <>
            <j-avatar
              initials={profile.username?.charAt(0)}
              hash={userId}
            ></j-avatar>
            <j-text>{profile.username}</j-text>
          </>
        )}
      </div>

      <div className={styles.loading}>
        <j-spinner size="lg"></j-spinner>
        <j-text>{profile?.username} connecting...</j-text>
      </div>

      <ul className={styles.settings}>
        {!settings.audio && (
          <li>
            <j-icon name="mic-mute"></j-icon>
          </li>
        )}
        {settings.screen && (
          <li>
            <j-icon name="display"></j-icon>
          </li>
        )}
      </ul>
      <>
        {reaction && (
          <div className={styles.reaction}>
            <div className={styles["reaction-inner"]}>
              <span>{reaction.reaction}</span>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
