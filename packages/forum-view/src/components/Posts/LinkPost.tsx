import { useContext, useEffect, useState } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import { getImage } from "utils/helpers/getImage";

export default function ImagePost({ post }) {
  const {
    state: { members },
  } = useContext(PerspectiveContext);

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";

  return (
    <a
      href={post.url}
      target="_blank"
      class={[styles.post, popularStyle].join(" ")}
    >
      <div class={styles.postImageWrapper}>
        <j-icon size="xl" name="link"></j-icon>
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
      </div>
    </a>
  );
}
