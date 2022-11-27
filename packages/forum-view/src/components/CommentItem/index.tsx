import { useContext, useEffect, useState } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import UIContext from "../../context/UIContext";
import Avatar from "../Avatar";
import Editor from "../Editor";
import createPostReply from "utils/api/createPostReply";
import getPosts from "utils/api/getPosts";

export default function CommentItem({ post }) {
  const [showComments, setShowComments] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const {
    state: { uuid, members },
  } = useContext(PerspectiveContext);

  useEffect(() => {
    fetchComments();
  }, []);

  function onProfileClick(event: any, did: string) {
    event.stopPropagation();
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  async function fetchComments() {
    const comments = await getPosts(uuid, post.id);
    setComments(comments);
  }

  async function submitComment() {
    try {
      setIsCreating(true);
      await createPostReply({
        perspectiveUuid: uuid,
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

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";
  const hasBody = post.body;
  const hasComments = comments.length > 0 && showComments;

  return (
    <div class={[styles.post, popularStyle].join(" ")}>
      <div class={styles.postLeft}>
        <div>
          {!showComments && (
            <j-icon
              size="sm"
              onClick={() => setShowComments(true)}
              name="chevron-expand"
            ></j-icon>
          )}
        </div>
        <Avatar
          size="xs"
          onClick={(e: any) => onProfileClick(e, author?.did)}
          did={author.did}
          url={author.profileThumbnailPicture}
        ></Avatar>
        {showComments && (
          <div
            onClick={() => setShowComments(false)}
            class={styles.collapseIndicator}
          ></div>
        )}
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
        {hasBody && showComments && (
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        )}
        {showComments && (
          <j-button
            onClick={() => setShowEditor(!showEditor)}
            variant="ghost"
            size="xs"
          >
            <j-icon name="chat-left" size="xs" slot="start"></j-icon>
            Reply
          </j-button>
        )}
        {showEditor && showComments && (
          <div>
            <Editor onChange={(content) => setComment(content)} />
            <j-button
              loading={isCreating}
              disabled={isCreating}
              onClick={submitComment}
              size="sm"
              variant="primary"
            >
              Comment
            </j-button>
          </div>
        )}

        {hasComments && showComments && (
          <j-box pt="300">
            {comments.map((post) => {
              return (
                <j-box mt="300">
                  <CommentItem post={post}></CommentItem>
                </j-box>
              );
            })}
          </j-box>
        )}
      </div>
    </div>
  );
}
