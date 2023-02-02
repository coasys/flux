import { useState, useEffect } from "preact/hooks";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";

import styles from "./Item.module.css";

type StreamUser = {
  did: string;
  candidate?: string;
  prefrences?: {
    audio: boolean;
    video: boolean;
    screen: boolean;
  };
};

type Props = {
  data: StreamUser;
  cameraEnabled?: boolean;
  videoRef?: React.MutableRefObject<null>;
};

export default function Item({ data, cameraEnabled, videoRef }: Props) {
  const [profile, setProfile] = useState<Profile>();

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(data.did);
      setProfile(profileResponse);
    }

    if (!profile) {
      fetchAgent();
    }
  }, [profile, data]);

  return (
    <div className={styles.item} data-camera-enabled={cameraEnabled}>
      <video
        ref={videoRef}
        className={styles.video}
        id={`user-video-${data.did}`}
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
