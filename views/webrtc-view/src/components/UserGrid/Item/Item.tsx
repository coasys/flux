import { useState, useEffect } from "preact/hooks";
import { Reaction } from "../../../types";
import { Settings } from "../../../WebRTCManager";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";

import styles from "./Item.module.css";

type Props = {
  userId: string;
  settings?: Settings;
  reaction?: Reaction;
  videoRef?: React.MutableRefObject<null>;
};

export default function Item({ userId, settings, reaction, videoRef }: Props) {
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
    <div className={styles.item} data-camera-enabled={settings.video}>
      <video
        ref={videoRef}
        className={styles.video}
        id={`user-video-${userId}`}
        autoPlay
        playsInline
      ></video>

      <div className={styles.details}>
        {profile?.username && (
          <>
            <j-avatar initials={profile.username?.charAt(0)}></j-avatar>
            <j-text>{profile.username}</j-text>
          </>
        )}
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
