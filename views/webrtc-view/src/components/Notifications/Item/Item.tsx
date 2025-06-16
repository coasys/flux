import { getProfile } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { useEffect, useState } from "preact/hooks";
import { Notification } from "../../../context/UiContext";

import styles from "./Item.module.css";

type Props = {
  data: Notification;
};

export default function Item({ data }: Props) {
  const { userId, type } = data;
  const [profile, setProfile] = useState<Profile | null>(null);

  async function getProfileData() {
    setProfile(await getProfile(userId));
  }

  useEffect(() => {
    if (getProfile && userId) getProfileData();
  }, [getProfile, userId]);

  return (
    <div className={styles.item}>
      <span>{profile?.username || <j-skeleton width="xxl" height="text"></j-skeleton>}</span>
      <span>
        {type === "connect" && "is connecting"}
        {type === "join" && "joined the room"}
        {type === "leave" && "left the room"}
      </span>
    </div>
  );
}
