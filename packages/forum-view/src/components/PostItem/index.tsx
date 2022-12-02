import { useContext, useState, useEffect } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { format, formatDistance, formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import { DisplayView } from "../../constants/options";
import { getImage } from "utils/helpers/getImage";
import UIContext from "../../context/UIContext";
import Avatar from "../Avatar";

export default function PostItem({ post, displayView }) {
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
    event.stopPropagation();
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";
  const displayStyle: DisplayView =
    displayView === DisplayView.Compact
      ? styles.compact
      : displayView === DisplayView.Grid
      ? styles.grid
      : styles.card;
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
        {hasUrl && ogData?.images?.length > 0 && (
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
          <j-icon size="xl" name="card-heading"></j-icon>
        )}
      </div>
      <div class={styles.postContentWrapper}>
        {hasTitle && <div className={styles.postTitle}>{post.title}</div>}

        <j-box pt="200">
          <j-flex a="center" gap="300">
            <Avatar
              size="xxs"
              onClick={(e) => onProfileClick(e, author.did)}
              did={author.did}
              url={author.profileThumbnailPicture}
            ></Avatar>
            <j-flex a="center" gap="200">
              <div
                className={styles.authorName}
                onClick={(e) => onProfileClick(e, author.did)}
              >
                {author?.username || (
                  <j-skeleton width="lg" height="text"></j-skeleton>
                )}
              </div>
              <div class={styles.timestamp}>
                {formatRelative(new Date(post.timestamp), new Date())}
              </div>
            </j-flex>
          </j-flex>
        </j-box>

        {hasUrl && (
          <j-box pt="200">
            <div class={styles.postUrl}>
              <j-icon size="xs" name="link"></j-icon>
              <a
                onClick={(e) => e.stopPropagation()}
                href={post.url}
                target="_blank"
              >
                {new URL(post.url).hostname}
              </a>
            </div>
          </j-box>
        )}
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
            <span>{post.comments.length}</span>
          </j-flex>
        </j-box>
      </div>
    </div>
  );
}
