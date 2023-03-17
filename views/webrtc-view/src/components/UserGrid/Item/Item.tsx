import { useState, useEffect, useRef } from "preact/hooks";
import { Reaction } from "../../../types";
import { Profile } from "utils/types";
import { WebRTC } from "../../../hooks/useWebrtc";
import getProfile from "utils/api/getProfile";

import styles from "./Item.module.css";

type Props = {
  webRTC: WebRTC;
  isMe?: boolean;
  userId: string;
  reaction?: Reaction;
  mirrored?: boolean;
  focused?: boolean;
  minimised?: boolean;
  onToggleFocus: () => void;
};

export default function Item({
  webRTC,
  isMe,
  userId,
  focused,
  minimised,
  reaction,
  mirrored,
  onToggleFocus,
}: Props) {
  const videoRef = useRef(null);
  const [profile, setProfile] = useState<Profile>();
  const [isConnecting, setIsConnecting] = useState(false);

  const peer = webRTC.connections.find((p) => p.did === userId);
  const settings = isMe ? webRTC.settings : peer?.settings;

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
  }, [peer]);

  // Get video stream
  useEffect(() => {
    if (videoRef.current && webRTC?.localStream && isMe) {
      console.log("AWDWAD");
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }

    if (videoRef.current && !isMe) {
      videoRef.current.srcObject = peer.connection.mediaStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, peer?.connection?.mediaStream, webRTC.localStream, isMe]);

  return (
    <div
      className={styles.item}
      data-camera-enabled={!!settings?.video}
      data-focused={focused}
      data-minimised={minimised}
      data-mirrored={mirrored}
      // data-talking={voiceInputVolume > 0}
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
        <div className={styles.avatar}>
          <j-avatar
            initials={profile?.username ? profile.username?.charAt(0) : "?"}
            hash={userId}
            size="xl"
          ></j-avatar>
        </div>
      </div>

      <div className={styles.username}>
        <span>{profile?.username || "Unknown user"}</span>
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
