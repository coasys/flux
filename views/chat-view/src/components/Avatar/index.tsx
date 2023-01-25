import { getImage } from "utils/helpers/getImage";
import { useEffect, useState } from "preact/hooks";

type AvatarProps = {
  did: string;
  url: string;
  style?: any;
  onClick?: (event: any) => void;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
};

export default function Avatar({
  did,
  url,
  style,
  onClick,
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

  return (
    <j-avatar
      style={{ ...style, cursor: onClick ? "pointer" : "default" }}
      src={img}
      hash={did}
      onClick={(e: any) => onClick && onClick(e)}
      size={size}
    ></j-avatar>
  );
}
