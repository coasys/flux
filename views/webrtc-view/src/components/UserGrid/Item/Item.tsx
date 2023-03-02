import { useState, useEffect } from "preact/hooks";
import hark from "hark";
import { Peer, Reaction } from "../../../types";
import { Settings } from "../../../WebRTCManager";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";

import styles from "./Item.module.css";

type Props = {
  isMe?: boolean;
  userId: string;
  settings?: Settings;
  reaction?: Reaction;
  mirrored?: boolean;
  focused?: boolean;
  minimised?: boolean;
  stream?: MediaStream;
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
  stream,
  peer,
  videoRef,
  onToggleFocus,
}: Props) {
  const [profile, setProfile] = useState<Profile>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceInputVolume, setVoiceInputVolume] = useState(0);

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

  // Detect speaking
  useEffect(() => {
    async function listenForVoice() {
      var options = {};
      var speechEvents = hark(stream, options);

      speechEvents.on("speaking", function () {
        setVoiceInputVolume(1);
      });

      speechEvents.on("stopped_speaking", function () {
        setVoiceInputVolume(0);
      });
    }

    if (stream) {
      listenForVoice();
    }
  }, [stream]);

  return (
    <div
      className={styles.item}
      data-camera-enabled={!!settings.video}
      data-focused={focused}
      data-minimised={minimised}
      data-mirrored={mirrored}
      data-talking={voiceInputVolume > 0}
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
