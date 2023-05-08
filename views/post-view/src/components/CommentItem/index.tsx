import { useContext, useEffect, useState, useMemo } from "preact/hooks";
import { CommunityContext, useEntries } from "utils/react-web";
import styles from "./index.module.css";
import { getTimeSince } from "utils/helpers";
import { Profile } from "utils/types";
import Avatar from "../Avatar";
import Editor from "../Editor";
import { Message as MessageModel } from "utils/api";

export default function CommentItem({ comment, perspective }) {
  const [showComments, setShowComments] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [commentContent, setComment] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const {
    state: { members },
  } = useContext(CommunityContext);

  const { entries: comments, model: Message } = useEntries({
    perspective,
    source: comment.id || null,
    model: MessageModel,
  });

  async function submitComment() {
    try {
      setIsCreating(true);
      await Message.create({ body: commentContent });
    } catch (e) {
      console.log(e);
    } finally {
      setIsCreating(false);
      setShowEditor(false);
    }
  }

  const author: Profile = members[comment.author] || {};
  const popularStyle: string = comment.isPopular ? styles.popularMessage : "";
  const hasBody = comment.body;
  const hasComments = comments.length > 0 && showComments;

  return (
    <div className={[styles.post, popularStyle].join(" ")}>
      <div className={styles.postLeft}>
        <div>
          {!showComments && (
            <j-icon
              size="sm"
              onClick={() => setShowComments(true)}
              name="chevron-expand"
            ></j-icon>
          )}
        </div>
        <a href={author.did}>
          <Avatar
            size="xs"
            did={author.did}
            url={author.profileThumbnailPicture}
          ></Avatar>
        </a>
        {showComments && (
          <div
            onClick={() => setShowComments(false)}
            className={styles.collapseIndicator}
          ></div>
        )}
      </div>
      <div className={styles.postContentWrapper}>
        <div className={styles.postDetails}>
          <a href={author.did} className={styles.authorName}>
            {author?.username || (
              <j-skeleton width="lg" height="text"></j-skeleton>
            )}
          </a>
          <span className={styles.timestamp}>
            {getTimeSince(new Date(comment.timestamp), new Date())}
          </span>
        </div>
        {hasBody && showComments && (
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: comment.body }}
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
          <j-box pt="300" pb="500">
            <Editor onChange={(content) => setComment(content)} />
            <j-box pt="200">
              <j-button
                loading={isCreating}
                disabled={isCreating}
                onClick={submitComment}
                size="sm"
                variant="primary"
              >
                Comment
              </j-button>
            </j-box>
          </j-box>
        )}

        {hasComments && showComments && (
          <j-box pt="300">
            {comments.map((comment) => {
              return (
                <j-box key={comment.id} mt="300">
                  <CommentItem
                    perspective={perspective}
                    comment={comment}
                  ></CommentItem>
                </j-box>
              );
            })}
          </j-box>
        )}
      </div>
    </div>
  );
}
