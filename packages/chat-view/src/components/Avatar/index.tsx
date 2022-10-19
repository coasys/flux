import getProfile, { getImage } from "utils/api/getProfile";
import { useEffect, useMemo, useState } from "preact/hooks";
import { Profile } from "utils/types";

type AvatarProps = {
  did: string;
  url: string;
  style: any;
  onProfileClick?: (did: string) => void;
  size?: "xs" | "sm" | "md" | "lg";
};

export default function Avatar({
  did,
  url,
  style,
  onProfileClick = () => {},
  size = "md",
}: AvatarProps) {
  const [img, setImage] = useState(null);

  useEffect(() => {
    if (url) {
      getImage(url)
        .then((data) => setImage(data))
        .catch((e) => console.error(e));
    }
  }, [did, url]);

  return (
    <j-avatar
      style={style}
      src={img}
      hash={did}
      onClick={() => onProfileClick(did)}
      size={size}
    ></j-avatar>
  );
}
