import { useContext, useRef } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { format, formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";

export default function MessageItem({ post }) {
  const messageTitle = post.titles[0].content;
  const messageBody = post.bodys[0].content;

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
    <div class={[styles.message, popularStyle].join(" ")}>
      <div class={styles.messageItemWrapper}>
        <div class={styles.messageItemContentWrapper}>
          <header class={styles.messageItemHeader}>
            <div
              onClick={() => onProfileClick(author?.did)}
              class={styles.messageUsername}
            >
              {author?.username || (
                <j-skeleton width="xl" height="text"></j-skeleton>
              )}
            </div>
            <small
              class={styles.timestamp}
              data-rh
              data-timestamp={format(
                new Date(post.timestamp),
                "EEEE, MMMM d, yyyy, hh:mm b"
              )}
            >
              {formatRelative(new Date(post.timestamp), new Date())}
            </small>
          </header>

          <div
            className={styles.messageTitle}
            dangerouslySetInnerHTML={{
              __html: messageTitle,
            }}
          ></div>
          <div
            ref={messageRef}
            class={styles.messageItemContent}
            style={{ display: "inline-flex" }}
            dangerouslySetInnerHTML={{
              __html: messageBody,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
