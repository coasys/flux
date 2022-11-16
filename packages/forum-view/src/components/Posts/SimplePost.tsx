import { useContext, useRef } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { format, formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";

export default function SimplePost({ post }) {
  const messageRef = useRef<any>(null);

  const {
    state: { members },
  } = useContext(PerspectiveContext);

  function onProfileClick(did: string) {
    const event = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
  }

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";

  return (
    <div class={[styles.post, popularStyle].join(" ")}>
      <div class={styles.postImageWrapper}>
        <j-icon size="xl" name="body-text"></j-icon>
      </div>
      <div class={styles.postContentWrapper}>
        <div className={styles.postTitle}>{post.title}</div>
        <div className={styles.postDetails}>
          Posted by
          <span class={styles.messageUsername}>
            {author?.username || (
              <j-skeleton width="lg" height="text"></j-skeleton>
            )}
          </span>
          <span class={styles.timestamp}>
            {formatRelative(new Date(post.timestamp), new Date())}
          </span>
        </div>
        <div
          className={styles.postBody}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </div>
    </div>
  );
}
