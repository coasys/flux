import { useContext, useState, useEffect } from "preact/hooks";
import { CommunityContext } from "utils/frameworks/react";
import styles from "./index.module.css";
import { format, formatDistance } from "date-fns/esm";
import { Profile } from "utils/types";
import { getTimeSince } from "utils/helpers";
import { DisplayView } from "../../constants/options";
import { getImage } from "utils/helpers";
import UIContext from "../../context/UIContext";
import Avatar from "../Avatar";

export default function PostItem({ post, displayView }) {
  const {
    state: { members },
  } = useContext(CommunityContext);
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

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";
  const displayStyle: DisplayView =
    displayView === DisplayView.Compact
      ? styles.compact
      : displayView === DisplayView.Grid
      ? styles.grid
      : styles.card;

  const showTite = post.title;
  const showImage = post.image;
  const showBody = post.body;
  const showUrl = post.url;
  const showDates = post.startDate && post.endDate;

  return (
    <div
      onClick={() => UIMehthods.goToPost(post.id)}
      className={[styles.post, displayStyle, popularStyle].join(" ")}
    >
      <div className={styles.postContentWrapper}>
        {showTite && (
          <j-text nomargin className={styles.postTitle} variant="heading">
            {post.title}
          </j-text>
        )}

        <j-box pt="400">
          <j-flex a="center" gap="300">
            <a href={author.did}>
              <Avatar
                size="xxs"
                did={author.did}
                url={author.profileThumbnailPicture}
              ></Avatar>
            </a>
            <j-flex a="center" gap="200">
              <a className={styles.authorName} href={author.did}>
                {author?.username || (
                  <j-skeleton width="lg" height="text"></j-skeleton>
                )}
              </a>
              <div className={styles.timestamp}>
                <j-timestamp relative value={post.timestamp}></j-timestamp>
              </div>
            </j-flex>
          </j-flex>
        </j-box>

        {showUrl && (
          <j-box pt="200">
            <div className={styles.postUrl}>
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
        {showDates && (
          <div className={styles.postDates}>
            <div className={styles.postDate}>
              <j-icon size="xs" name="calendar-event"></j-icon>
              {format(new Date(post.startDate), "dd.MMMM HH:HH")}
            </div>
            <div className={styles.postDate}>
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
        <j-box pt="500">
          <j-flex a="center" gap="200">
            <j-icon size="xs" name="chat-left-text"></j-icon>
            <span>{post.comments.length}</span>
          </j-flex>
        </j-box>
      </div>
      <div className={styles.postImageWrapper}>
        {showUrl && ogData?.images?.length > 0 && (
          <img src={ogData.images[0]} className={styles.postImage} />
        )}
        {showImage && <img className={styles.postImage} src={post.image} />}
        {showDates && (
          <div className={styles.calendar}>
            <span className={styles.calendarMonth}>
              {format(new Date(post.startDate), "MMM")}
            </span>
            <span className={styles.calendarDate}>
              {format(new Date(post.startDate), "dd")}th
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
