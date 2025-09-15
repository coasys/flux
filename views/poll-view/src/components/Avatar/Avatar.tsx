import { Profile } from "@coasys/flux-types";
import { useEffect, useState } from "preact/hooks";
import styles from "./Avatar.module.scss";

type Props = {
  did: string;
  size?: "sm" | "xs" | "lg" | "xl" | "xxs" | "xxl";
  showName?: boolean;
  style?: any;
  getProfile: (did: string) => Promise<Profile>;
};

export default function Avatar({ did, size = "sm", showName = false, style, getProfile }: Props) {
  const [profile, setProfile] = useState<Partial<Profile>>({});

  async function getProfileData() {
    const profile = await getProfile(did);
    setProfile(profile);
  }

  useEffect(() => {
    if (getProfile) getProfileData();
  }, [getProfile]);

  return (
    <j-flex gap="300" a="center" style={style}>
      <div className={styles.image} style={{ height: size === "xs" ? 28 : 36 }}>
        <j-avatar size={size} src={profile.profileThumbnailPicture || null} hash={did} />
      </div>
      {showName && <j-text nomargin>{profile.username}</j-text>}
    </j-flex>
  );
}
