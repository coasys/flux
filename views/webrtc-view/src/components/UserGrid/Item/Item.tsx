import { WebRTC } from "@coasys/flux-react-web";
import { Profile } from "@coasys/flux-types";
import { useEffect, useRef, useState } from "preact/hooks";
import { Reaction } from "../../../types";

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
  getProfile: (did: string) => Promise<Profile>;
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
  getProfile,
}: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isConnecting, setIsConnecting] = useState(isMe ? false : true);
  const videoRef = useRef(null);

  const peer = webRTC.connections.find((p) => p.did === userId);
  const settings = isMe ? webRTC.localState.settings : peer?.state?.settings;

  async function getProfileData() {
    setProfile(await getProfile(userId));
  }

  useEffect(() => {
    if (getProfile && userId) getProfileData();
  }, [getProfile, userId]);

  // Get loading state
  useEffect(() => {
    if (isMe) return;

    peer?.connection?.peer?.on("connect", () => {
      setIsConnecting(false);
    });
  }, [peer]);

  // Get video stream
  useEffect(() => {
    if (videoRef.current && webRTC?.localStream && isMe) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }

    if (videoRef.current && !isMe) {
      peer.connection.peer.on("stream", (stream) => {
        videoRef.current.srcObject = stream;
      });
    }
  }, [videoRef, peer?.connection?.peer, webRTC.localStream, isMe]);

  return (
    <div
      className={styles.item}
      data-camera-enabled={!!settings?.video || !!settings.screen}
      data-focused={focused}
      data-minimised={minimised}
      data-mirrored={mirrored}
      // data-talking={voiceInputVolume > 0}
      data-connecting={isConnecting}
    >
      <video ref={videoRef} className={styles.video} id={`user-video-${userId}`} autoPlay playsInline></video>

      <div className={styles.details} onClick={onToggleFocus}>
        <div className={styles.avatar}>
          <j-avatar
            initials={profile?.username?.charAt(0) || "?"}
            size="xl"
            src={profile?.profileThumbnailPicture || null}
            hash={userId}
          />
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
