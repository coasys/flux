import { useContext, useRef } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { format, formatDistance, formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import { DisplayView } from "../../constants/options";

export default function SimplePost({ post, displayView }) {
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
  const displayStyle: DisplayView =
    displayView === DisplayView.Compact ? styles.compact : styles.grid;

  return (
    <div class={[styles.post, displayStyle, popularStyle].join(" ")}>
      <div class={styles.postImageWrapper}>
        <div class={styles.calendar}>
          <span class={styles.calendarMonth}>
            {format(new Date(post.startDate), "MMM")}
          </span>
          <span class={styles.calendarDate}>
            {format(new Date(post.startDate), "dd")}th
          </span>
        </div>
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
        <div class={styles.postDates}>
          <div class={styles.postDate}>
            <j-icon size="xs" name="calendar-event"></j-icon>
            {format(new Date(post.startDate), "dd.MMMM HH:HH")}
          </div>
          <div class={styles.postDate}>
            <j-icon size="xs" name="clock"></j-icon>
            <j-tooltip title={format(new Date(post.endDate), "dd.MMMM HH:HH")}>
              {formatDistance(new Date(post.startDate), new Date(post.endDate))}
            </j-tooltip>
          </div>
        </div>
        <div
          className={styles.postBody}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </div>
    </div>
  );
}
