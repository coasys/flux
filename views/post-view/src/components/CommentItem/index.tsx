import { useState } from "preact/hooks";
import { useAgent, useEntries } from "@fluxapp/react-web";
import styles from "./index.module.css";
import { getTimeSince } from "@fluxapp/utils";
import Avatar from "../Avatar";
import Editor from "../Editor";
import { Message as MessageModel } from "@fluxapp/api";

export default function CommentItem({ agent, comment, perspective }) {
  const [showComments, setShowComments] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [commentContent, setComment] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const { entries: comments, model: Message } = useEntries({
    perspective,
    source: comment.id || null,
    model: MessageModel,
  });

  const { profile } = useAgent({ client: agent, did: comment.author });

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
        <a href={profile?.did}>
          <Avatar
            size="xs"
            did={profile?.did}
            url={profile?.profileThumbnailPicture}
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
          <a href={profile?.did} className={styles.authorName}>
            {profile?.username || (
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
            <flux-editor
              placeholder="Add a comment..."
              perspective={perspective}
              agent={agent}
              source={comment.id}
            ></flux-editor>
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
