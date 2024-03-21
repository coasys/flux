import { getImage } from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";

type AvatarProps = {
  size: "" | "xxs" | "xs" | "md" | "sm" | "lg" | "xl" | "xxl";
  profileAddress?: string;
  hash?: string;
  initials?: string;
};

export default function Avatar({
  size = "md",
  hash,
  profileAddress,
  initials
}: AvatarProps) {
  const [image, setImage] = useState<string>();

  useEffect(() => {
    if (typeof profileAddress === "string") {
      if (profileAddress.includes("base64")) {
        setImage(profileAddress);
      } else {
        getProfileImage(profileAddress);
      }
    } else {
      setImage(null);
    }
  }, [profileAddress]);

  async function getProfileImage(url: string) {
    try {
      const src = await getImage(url);
      setImage(src);
    } finally {
    }
  }

  return <j-avatar initials={initials} size={size} src={image} hash={hash}></j-avatar>;
}
