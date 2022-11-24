import { useContext } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import UIContext from "../../context/UIContext";
import Avatar from "../Avatar";

export default function Post({ post }) {
  const {
    state: { members },
  } = useContext(PerspectiveContext);
  const { methods: UIMehthods } = useContext(UIContext);

  function onProfileClick(event: any, did: string) {
    event.stopPropagation();
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";
  const hasBody = post.body;

  return (
    <div
      onClick={() => UIMehthods.goToPost(post.id)}
      class={[styles.post, popularStyle].join(" ")}
    >
      <div class={styles.postLeft}>
        <Avatar
          size="xs"
          onClick={(e: any) => onProfileClick(e, author?.did)}
          did={author.did}
          url={author.profileThumbnailPicture}
        ></Avatar>
      </div>
      <div class={styles.postContentWrapper}>
        <div class={styles.postDetails}>
          <span
            onClick={(e: any) => onProfileClick(e, author?.did)}
            className={styles.authorName}
          >
            {author?.username || (
              <j-skeleton width="lg" height="text"></j-skeleton>
            )}
          </span>
          <span class={styles.timestamp}>
            {formatRelative(new Date(post.timestamp), new Date())}
          </span>
        </div>
        {hasBody && (
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        )}
      </div>
    </div>
  );
}
