import UIContext from "../../context/UIContext";
import ChannelContext from "utils/react/ChannelContext";
import CommunityContext from "utils/react/CommunityContext";
import { useContext, useEffect, useState } from "preact/hooks";
import { formatRelative, format, formatDistance } from "date-fns";
import styles from "./index.scss";
import createPostReply from "utils/api/createPostReply";
import { getImage } from "utils/helpers/getImage";
import Editor from "../Editor";
import CommentItem from "../CommentItem";
import getPosts from "utils/api/getPosts";
import PostModel from "utils/api/post";
import { EntryType } from "utils/types";
import Avatar from "../Avatar";

export default function Post() {
  const [base64, setBase64] = useState("");
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { state: UIState, methods: UIMethods } = useContext(UIContext);
  const { state: communityState } = useContext(CommunityContext);
  const { state } = useContext(ChannelContext);
  const post = state.keyedPosts[UIState.currentPost];

  function onProfileClick(event: any, did: string) {
    event.stopPropagation();
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  async function fetchComments() {
    const comments = await getPosts(state.communityId, post.id);
    setComments(comments);
  }

  useEffect(() => {
    fetchComments();
    const Post = new PostModel({ perspectiveUuid: state.communityId, source: post.id });
    Post.get(post.id).then((e) => console.log('commentys', e));
  }, []);

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
    try {
      setIsCreating(true);
      await createPostReply({
        perspectiveUuid: state.communityId,
        postId: post.id,
        message: comment,
      });
      await fetchComments();
    } catch (e) {
      console.log(e);
    } finally {
      setIsCreating(false);
    }
  }

  const author = communityState.members[post.author] || {};
  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;
  const hasDates = post.startDate && post.endDate;
  const hasComments = comments.length > 0;

  return (
    <div class={styles.post}>
      <j-box pb="500">
        <j-button size="sm" variant="link" onClick={() => UIMethods.goToFeed()}>
          <j-icon name="arrow-left-short" slot="start"></j-icon>
          Back
        </j-button>
      </j-box>

      {hasTitle && (
        <j-box pt="300">
          <j-text nomargin variant="heading-lg">
            {post.title}
          </j-text>
        </j-box>
      )}

      <j-box pt="600">
        <j-flex a="center" gap="400">
          <Avatar
            size="sm"
            did={author.did}
            url={author.profileThumbnailPicture}
          ></Avatar>
          <div>
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
          </div>
        </j-flex>
      </j-box>

      {hasImage && base64 && (
        <j-box bg="white" mt="600">
          <img class={styles.postImage} src={base64} />
        </j-box>
      )}

      {hasUrl && (
        <j-box pt="400">
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
        <j-box pt="500">
          <j-flex gap="300" direction="column">
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
          </j-flex>
        </j-box>
      )}

      {hasBody && (
        <j-box pt="500">
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </j-box>
      )}

      <j-box pt="900">
        <Editor onChange={(e) => setComment(e)}></Editor>
        <j-box pt="300">
          <j-button
            disabled={isCreating}
            loading={isCreating}
            size="sm"
            variant="primary"
            onClick={submitComment}
          >
            Make a comment
          </j-button>
        </j-box>
      </j-box>

      {hasComments && (
        <j-box pt="900">
          <j-text variant="label">Comments ({comments.length})</j-text>
          <j-box>
            {comments.map((post) => {
              return (
                <j-box key={post.id} mt="400">
                  <CommentItem post={post}></CommentItem>
                </j-box>
              );
            })}
          </j-box>
        </j-box>
      )}
    </div>
  );
}
