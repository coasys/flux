import { useContext, useState, useEffect } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { format, formatDistance, formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import { DisplayView } from "../../constants/options";
import { getImage } from "utils/helpers/getImage";
import UIContext from "../../context/UIContext";

export default function Post({ post, displayView }) {
  const {
    state: { members },
  } = useContext(PerspectiveContext);
  const { methods: UIMehthods } = useContext(UIContext);

  const [base64, setBase64] = useState("");
  const [ogData, setOgData] = useState(null);

  async function fetchImage(url) {
    const image = await getImage(url);
    setBase64(image);
  }

  async function fetchOgData(url) {
    try {
      const data = await fetch(
        "https://jsonlink.io/api/extract?url=" + url
      ).then((res) => res.json());
      setOgData(data);
    } catch (e) {}
  }

  useEffect(() => {
    if (post.image) {
      fetchImage(post.image);
    }
    if (post.url) {
      fetchOgData(post.url);
    }
  }, [post.image, post.url]);

  function onProfileClick(event: any, did: string) {
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";
  const displayStyle: DisplayView =
    displayView === DisplayView.Compact ? styles.compact : styles.grid;
  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;
  const hasDates = post.startDate && post.endDate;

  return (
    <div
      onClick={() => UIMehthods.goToPost(post.id)}
      class={[styles.post, displayStyle, popularStyle].join(" ")}
    >
      <div class={styles.postImageWrapper}>
        {hasUrl && ogData?.images[0] && (
          <img src={ogData.images[0]} class={styles.postImage} />
        )}
        {hasImage && base64 && <img class={styles.postImage} src={base64} />}
        {hasDates && (
          <div class={styles.calendar}>
            <span class={styles.calendarMonth}>
              {format(new Date(post.startDate), "MMM")}
            </span>
            <span class={styles.calendarDate}>
              {format(new Date(post.startDate), "dd")}th
            </span>
          </div>
        )}
        {!hasUrl && !hasDates && !hasImage && (
          <j-icon name="card-heading"></j-icon>
        )}
      </div>
      <div class={styles.postContentWrapper}>
        {hasTitle && <div className={styles.postTitle}>{post.title}</div>}
        <div className={styles.postDetails}>
          Posted by
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
        {hasDates && (
          <div class={styles.postDates}>
            <div class={styles.postDate}>
              <j-icon size="xs" name="calendar-event"></j-icon>
              {format(new Date(post.startDate), "dd.MMMM HH:HH")}
            </div>
            <div class={styles.postDate}>
              <j-icon size="xs" name="clock"></j-icon>
              <j-tooltip
                title={format(new Date(post.endDate), "dd.MMMM HH:HH")}
              >
                {formatDistance(
                  new Date(post.startDate),
                  new Date(post.endDate)
                )}
              </j-tooltip>
            </div>
          </div>
        )}
        {hasBody && (
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        )}
        <j-box pt="500">
          <j-flex a="center" gap="200">
            <j-icon size="xs" name="chat-left-text"></j-icon>
            <span>{post.replies.length}</span>
          </j-flex>
        </j-box>
      </div>
    </div>
  );
}
