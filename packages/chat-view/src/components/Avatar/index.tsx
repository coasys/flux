import { getImage } from "utils/api/getProfile";
import { useEffect, useState } from "preact/hooks";

type AvatarProps = {
  did: string;
  url: string;
  style?: any;
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
  const [loading, setLoading] = useState(false);
  const [img, setImage] = useState(null);

  async function fetchImage(imageUrl) {
    try {
      setLoading(true);
      const image = await getImage(imageUrl);
      setImage(image);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (url) {
      fetchImage(url);
    }
  }, [did, url]);

  if (loading)
    return (
      <j-skeleton
        variant="circle"
        style={style}
        onClick={() => onProfileClick(did)}
        height={size}
        width={size}
      ></j-skeleton>
    );

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
