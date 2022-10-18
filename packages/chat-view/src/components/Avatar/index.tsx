import { getImage } from "utils/api/getProfile";
import { useEffect, useState } from "preact/hooks";
import { Profile } from "utils/types";

type AvatarProps = {
  author: Profile;
  style: any;
  onProfileClick?: (did: string) => void;
  size?: "xs" | "sm" | "md" | "lg";
};

export default function Avatar({
  author,
  style,
  onProfileClick = () => {},
  size = "md",
}: AvatarProps) {
  const [img, setImage] = useState(null);

  useEffect(() => {
    if (author.thumbnailPicture) {
      getImage(author.thumbnailPicture)
        .then((data) => setImage(data))
        .catch((e) => console.error(e));
    }
  }, [author]);

  return (
    <j-avatar
      style={style}
      src={img}
      hash={author.did}
      onClick={() => onProfileClick(author.did)}
      size={size}
    ></j-avatar>
  );
}
