import { getImage } from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";

type AvatarProps = {
  size: "" | "sm" | "xs" | "lg" | "xl" | "xxs" | "xxl";
  did: string;
  profile?: any;
};

export default function Avatar({ size = "sm", did, profile }: AvatarProps) {
  const [image, setImage] = useState("");
  const [name, setName] = useState("");

  async function getProfileImage(url: string) {
    try {
      const src = await getImage(url);
      setImage(src);
    } finally {
      setImage("");
    }
  }

  useEffect(() => {
    if (profile) {
      const { profilePicture: url, username, givenName, familyName } = profile;
      // set image
      if (typeof url === "string" && url.includes("base64")) setImage(url);
      else getProfileImage(url);
      // set name
      setName(givenName ? `${givenName} ${familyName}` : username);
    }
  }, [profile]);

  return (
    <j-flex gap="300" a="center">
      <j-avatar size={size} src={image} hash={did} />
      {name && <j-text nomargin>{name}</j-text>}
    </j-flex>
  );
}
