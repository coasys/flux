import UIContext from "../../context/UIContext";
import ChannelContext from "utils/react/ChannelContext";
import CommunityContext from "utils/react/CommunityContext";
import { useContext, useEffect, useState } from "preact/hooks";
import { formatRelative, format, formatDistance } from "date-fns";
import styles from "./index.scss";
import createPostReply from "utils/api/createPostReply";
import { getImage } from "utils/helpers/getImage";
import Editor from "../CreatePost/Editor";

export default function Post() {
  const [base64, setBase64] = useState("");
  const [comment, setComment] = useState("");
  const { state: UIState, methods: UIMethods } = useContext(UIContext);
  const { state: communityState } = useContext(CommunityContext);
  const { state } = useContext(ChannelContext);
  const post = state.keyedPosts[UIState.currentPost];

  async function fetchImage(url) {
    const image = await getImage(url);
    setBase64(image);
  }

  useEffect(() => {
    if (post.image) {
      fetchImage(post.image);
    }
  }, [post.image, post.url]);

  async function submitComment() {
    createPostReply({
      perspectiveUuid: state.communityId,
      postId: post.id,
      message: "Hello",
    });
  }

  const author = communityState.members[post.author] || {};
  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;
  const hasDates = post.startDate && post.endDate;

  return (
    <div class={styles.post}>
      <j-button variant="link" onClick={() => UIMethods.goToFeed()}>
        <j-icon name="arrow-left" slot="start"></j-icon>
        Back
      </j-button>

      {hasTitle && (
        <j-box pt="900">
          <j-text nomargin variant="heading">
            {post.title}
          </j-text>
        </j-box>
      )}

      <div className={styles.postDetails}>
        Posted by
        <span className={styles.authorName}>
          {author?.username || (
            <j-skeleton width="lg" height="text"></j-skeleton>
          )}
        </span>
        <span class={styles.timestamp}>
          {formatRelative(new Date(post.timestamp), new Date())}
        </span>
      </div>

      {hasImage && base64 && (
        <j-box bg="white" mt="500">
          <img class={styles.postImage} src={base64} />
        </j-box>
      )}

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
            <j-tooltip title={format(new Date(post.endDate), "dd.MMMM HH:HH")}>
              {formatDistance(new Date(post.startDate), new Date(post.endDate))}
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
          <span>{post.replies.length} Comments</span>
        </j-flex>
      </j-box>
      <j-box pt="500">
        <Editor onChange={() => null}></Editor>
        <j-box pt="300">
          <j-button variant="primary" onClick={submitComment}>
            Make a comment
          </j-button>
        </j-box>
      </j-box>
    </div>
  );
}
