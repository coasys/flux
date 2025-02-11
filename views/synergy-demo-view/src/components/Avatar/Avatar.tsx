import { getProfile } from "@coasys/flux-api";
import { getImage } from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";
import styles from "./Avatar.module.scss";

type Props = {
  did: string;
  size?: "sm" | "xs" | "lg" | "xl" | "xxs" | "xxl";
  showName?: boolean;
  style?: any;
};

export default function Avatar({ did, size = "sm", showName = false, style }: Props) {
  const [image, setImage] = useState("");
  const [name, setName] = useState("");

  async function getData() {
    const { username, profileThumbnailPicture: picture } = await getProfile(did);
    if (picture && picture.includes("base64")) setImage(picture);
    else setImage((await getImage(picture)) || "");
    setName(username);
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <j-flex gap="300" a="center" style={style}>
      <div className={styles.image}>
        <j-avatar size={size} src={image} hash={did} />
      </div>
      {showName && name && <j-text nomargin>{name}</j-text>}
    </j-flex>
  );
}
