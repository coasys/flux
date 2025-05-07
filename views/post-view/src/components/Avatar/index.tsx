import { Profile } from "@coasys/flux-types";
import { useEffect, useState } from "preact/hooks";

type AvatarProps = {
  did: string;
  style?: any;
  size?: "" | "xxs" | "xs" | "sm" | "lg" | "xl" | "xxl";
  onClick?: (event: any) => void;
  getProfile: (did: string) => Promise<Profile>;
};

export default function Avatar({ did, style, size = "", onClick, getProfile }: AvatarProps) {
  const [profile, setProfile] = useState<Partial<Profile>>({});

  async function getProfileData() {
    setProfile(await getProfile(did));
  }

  useEffect(() => {
    if (getProfile && did) getProfileData();
  }, [getProfile, did]);

  return (
    <j-avatar
      style={{ ...style, cursor: onClick ? "pointer" : "default" }}
      hash={did}
      src={profile.profileThumbnailPicture || null}
      onClick={(e: any) => onClick && onClick(e)}
      size={size}
    />
  );
}
