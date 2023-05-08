import { useEffect, useRef, useState } from "preact/hooks";
import { Profile } from "utils/types";
import { getProfile } from "utils/api";
import { WebRTC } from "utils/react-web";
import characters from "../../sprites/characters";

import Sprite from "../Sprite/Sprite";

import styles from "./User.module.css";

type Props = {
  webRTC: WebRTC;
  userId: string;
  spriteIndex: number;
  isDrawing?: boolean;
  isLocalUser?: boolean;
};

export default function User({
  webRTC,
  spriteIndex,
  userId,
  isDrawing,
  isLocalUser,
}: Props) {
  const videoRef = useRef(null);
  const [profile, setProfile] = useState<Profile>();

  const peer = webRTC.connections.find((p) => p.did === userId);
  const palette = characters.palette as string[];
  const spriteData = characters.frames[spriteIndex] as string;

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(userId);
      setProfile(profileResponse);
    }

    if (!profile && userId) {
      fetchAgent();
    }
  }, [profile, userId]);

  // Get video stream
  useEffect(() => {
    if (videoRef.current && webRTC?.localStream && isLocalUser) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }

    if (videoRef.current && !isLocalUser) {
      peer.connection.peer.on("stream", (stream) => {
        videoRef.current.srcObject = stream;
      });
    }
  }, [videoRef, peer?.connection?.peer, webRTC.localStream, isLocalUser]);

  return (
    <div className={styles.wrapper} data-drawing={isDrawing}>
      <div className={styles.header}>
        <div className={styles.username}>
          <span>{profile?.username || "Unknown user"}</span>
        </div>
      </div>

      <div className={styles.sprite}>
        <Sprite hash={spriteData} palette={palette} />

        <div className={styles.pencil}>
          <Sprite
            hash={
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaadbbbbbbaaaebccccccaaaadbbbbbbaaaaaaaaaaaaaaaaaaaaaaaa"
            }
            palette={[
              "fff0",
              "fcd473",
              "F2994A",
              "FCE288",
              "000",
              "b4a4a3",
              "fff",
              "f0d37a",
              "fcd684",
              "fc9467",
            ]}
          />
        </div>

        <video
          ref={videoRef}
          className={styles.video}
          id={`user-video-${userId}`}
          autoPlay
          playsInline
        ></video>
      </div>
    </div>
  );
}
