import { useState, useEffect } from "preact/hooks";
import { Peer } from "../../../types";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";

import styles from "./Item.module.css";

type Props = {
  userId: string;
  cameraEnabled?: boolean;
  videoRef?: React.MutableRefObject<null>;
};

export default function Item({ userId, cameraEnabled, videoRef }: Props) {
  const [profile, setProfile] = useState<Profile>();

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

  return (
    <div className={styles.item} data-camera-enabled={cameraEnabled}>
      <video
        ref={videoRef}
        className={styles.video}
        id={`user-video-${userId}`}
        autoPlay
        playsInline
      ></video>

      <div className={styles.details}>
        <j-avatar initials={profile?.username.charAt(0)}></j-avatar>
        <j-text>{profile?.username}</j-text>
      </div>
    </div>
  );
}
