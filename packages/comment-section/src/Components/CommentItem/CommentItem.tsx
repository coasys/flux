import { Message, getProfile } from "@coasys/flux-api";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { useEffect, useState } from "preact/hooks";
import { Profile } from "@coasys/flux-types";
import styles from "./CommentItem.module.css";
import Avatar from "../Avatar";

export default function CommentItem({
  agent,
  comment,
  perspective,
}: {
  agent: AgentClient;
  comment: Message;
  perspective: PerspectiveProxy;
}) {
  const [profile, setProfile] = useState<null | Profile>(null);

  useEffect(() => {
    if (comment?.author) {
      getProfile(comment.author).then((p) => setProfile(p));
    }
  }, [comment?.author]);

  return (
    <div className={styles.container}>
      <a href={comment.author} className={styles.link}>
        <Avatar
          size="sm"
          did={comment.author}
          src={profile?.profileThumbnailPicture}
        ></Avatar>
      </a>
      <div className={styles.author}>
        <a href={comment.author} className={styles.link}>
          <span className={styles.username}>{profile?.username}</span>
        </a>
        <span className={styles.timestamp}>
          {formatTimeAgo(comment.timestamp)}
        </span>
      </div>
      <div></div>
      <div
        className={styles.comment}
        dangerouslySetInnerHTML={{ __html: comment?.body }}
      ></div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const now = new Date().getTime();
  const diff = now - new Date(timestamp).getTime();

  if (diff < 60000) {
    return "Just now";
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diff < 2592000000) {
    const days = Math.floor(diff / 86400000);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else if (diff < 31536000000) {
    const months = Math.floor(diff / 2592000000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  } else {
    const years = Math.floor(diff / 31536000000);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }
}
