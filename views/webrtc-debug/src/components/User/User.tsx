import { useEffect, useRef, useState } from "preact/hooks";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";
import { WebRTC } from "../../hooks/useWebrtc";
import characters from "../../sprites/characters";

import Sprite from "../Sprite/Sprite";

import styles from "./User.module.css";

type Props = {
  webRTC: WebRTC;
  userId: string;
  spriteIndex: number;
  isLocalUser?: boolean;
};

export default function User({
  webRTC,
  spriteIndex,
  userId,
  isLocalUser,
}: Props) {
  const videoRef = useRef(null);
  const [profile, setProfile] = useState<Profile>();
  const [stream, setStream] = useState<MediaStream>();

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

  // Listen to changes in remote stream
  useEffect(() => {
    if (!isLocalUser) {
      const remoteStream = new MediaStream();

      if (peer.connection.peerConnection) {
        peer.connection.peerConnection.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };
      }

      setStream(remoteStream);
    }
  }, [peer, isLocalUser]);

  // Get video stream
  useEffect(() => {
    if (videoRef.current && webRTC?.localStream && isLocalUser) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }

    if (videoRef.current && !isLocalUser) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
    }
  }, [videoRef, stream, webRTC.localStream, isLocalUser]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.username}>
          <span>{profile?.username || "Unknown user"}</span>
        </div>
      </div>

      <div className={styles.sprite}>
        <Sprite hash={spriteData} palette={palette} />

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
