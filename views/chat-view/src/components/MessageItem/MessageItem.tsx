import { PerspectiveProxy, Literal, LinkQuery } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { Message } from "@fluxapp/api";
import { useState } from "preact/hooks";
import { useAgent, useEntries, useEntry } from "@fluxapp/react-web";
import styles from "./MessageItem.module.css";
import { useEffect } from "preact/hooks";
import { community } from "@fluxapp/constants";

const { REPLY_TO } = community;

export default function MessageItem({
  showAvatar,
  agent,
  perspective,
  message,
  isReplying,
  isThread,
  onEmojiClick = () => {},
  onReplyClick = () => {},
  onThreadClick = () => {},
}: {
  perspective: PerspectiveProxy;
  showAvatar?: boolean;
  isReplying?: boolean;
  isThread?: boolean;
  agent: AgentClient;
  message: Message;

  onEmojiClick?: (message: Message, position: { x: number; y: number }) => void;
  onReplyClick?: (message: Message) => void;
  onThreadClick?: (message: Message) => void;
}) {
  const [replyId, setReplyId] = useState("");

  const { profile } = useAgent({ client: agent, did: message.author });

  const { entries: threadMessages } = useEntries({
    perspective,
    source: message.id,
    model: Message,
  });

  const { entry: replyMessage } = useEntry({
    perspective,
    id: replyId,
    source: null,
    model: Message,
  });

  const { profile: replyProfile } = useAgent({
    client: agent,
    did: replyMessage?.author,
  });

  useEffect(() => {
    perspective
      .get(new LinkQuery({ target: message.id, predicate: REPLY_TO }))
      .then((res) => {
        if (res.length > 0) {
          setReplyId(res[0].data.source);
        }
      });
  }, [message.id]);

  function onOpenPicker(e) {
    e.stopPropagation();
    onEmojiClick(message, { x: e.clientX, y: e.clientY });
  }

  const isFullVersion = replyId || showAvatar;

  return (
    <div className={`${styles.message} ${isReplying && styles.isReplying}`}>
      <div className={styles.messageLeft}>
        {isFullVersion && (
          <j-avatar
            size="md"
            src={profile?.profileThumbnailPicture}
            hash={message.author}
          ></j-avatar>
        )}
      </div>
      <div className={styles.messageRight}>
        {replyId && replyMessage?.id && (
          <j-box pb="300">
            <j-flex a="center" gap="200">
              <j-avatar
                size="xxs"
                src={replyProfile?.profileThumbnailPicture}
                hash={replyMessage.author}
              ></j-avatar>
              <span>{replyProfile?.username}</span>
              <j-text
                size="300"
                class={styles.body}
                nomargin
                dangerouslySetInnerHTML={{ __html: replyMessage.body }}
              ></j-text>
            </j-flex>
          </j-box>
        )}
        {isFullVersion && (
          <header className={styles.header}>
            <a href={message.author} className={styles.username}>
              {profile?.username}
            </a>
            <j-timestamp
              className={styles.timestamp}
              relative
              value={message.timestamp}
            ></j-timestamp>
          </header>
        )}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: message.body }}
        ></div>
        <div className={styles.reactions}>
          {message.reactions.map((r) => {
            if (!r.startsWith("literal://")) return null;
            return (
              <span className={styles.reaction}>
                {Literal.fromUrl(r).get()}
              </span>
            );
          })}
        </div>
        {threadMessages?.length > 0 && (
          <j-box py="300">
            <button
              className={styles.threadButton}
              onClick={() => onThreadClick(message)}
              variant="subtle"
              size="sm"
            >
              Replies ({threadMessages.length})
            </button>
          </j-box>
        )}
      </div>
      <div className={styles.toolbar}>
        <j-tooltip placement="top" title="Add reaction">
          <j-button onClick={onOpenPicker} size="sm" square variant="ghost">
            <j-icon size="sm" name="emoji-smile"></j-icon>
          </j-button>
        </j-tooltip>
        <>
          {!isThread && (
            <j-tooltip placement="top" title="Reply in thread">
              <j-button
                onClick={() => onThreadClick(message)}
                size="sm"
                square
                variant="ghost"
              >
                <j-icon size="sm" name="chat-text"></j-icon>
              </j-button>
            </j-tooltip>
          )}
        </>
        <j-tooltip placement="top" title="Reply">
          <j-button
            onClick={() => onReplyClick(message)}
            size="sm"
            square
            variant="ghost"
          >
            <j-icon size="sm" name="reply"></j-icon>
          </j-button>
        </j-tooltip>
      </div>
    </div>
  );
}
