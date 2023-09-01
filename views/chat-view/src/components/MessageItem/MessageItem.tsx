import { PerspectiveProxy, Literal, LinkQuery } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { Message } from "@fluxapp/api";
import { useState } from "preact/hooks";
import { useAgent, useEntries, useEntry } from "@fluxapp/react-web";
import styles from "./MessageItem.module.css";
import { useEffect } from "preact/hooks";
import { community } from "@fluxapp/constants";
import Avatar from "../Avatar";

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

  const { entry: replyMessage } = useEntry({
    perspective,
    id: replyId,
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

  const reactionCounts = message.reactions.reduce((acc, reaction) => {
    return {
      ...acc,
      [reaction]: acc[reaction] ? acc[reaction] + 1 : 1,
    };
  }, {});

  return (
    <div
      className={`${styles.message} ${isReplying && styles.isReplying} ${
        message.isPopular && styles.isPopular
      }`}
    >
      <div className={styles.messageLeft}>
        {isFullVersion && (
          <j-box pt={replyId && replyMessage?.id ? "500" : ""}>
            <Avatar
              size="md"
              profileAddress={profile?.profileThumbnailPicture}
              hash={message.author}
            ></Avatar>
          </j-box>
        )}
      </div>
      <div className={styles.messageRight}>
        {replyId && replyMessage?.id && (
          <j-box pb="300">
            <j-flex a="center" gap="200">
              <Avatar
                size="xxs"
                profileAddress={replyProfile?.profileThumbnailPicture}
                hash={replyMessage.author}
              ></Avatar>
              <span>{replyProfile?.username}</span>
              <j-text
                size="300"
                className={styles.body}
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
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            if (!emoji.startsWith("emoji://")) return null;
            return (
              <span className={styles.reaction}>
                {hexToEmoji(emoji.split("emoji://")[1])} {count}
              </span>
            );
          })}
        </div>
        {message.thread?.length > 0 && (
          <j-box py="300">
            <button
              className={styles.threadButton}
              onClick={() => onThreadClick(message)}
              variant="subtle"
              size="sm"
            >
              Replies ({message.thread.length})
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

function hexToEmoji(hex: string): string | null {
  try {
    // Parse the hexadecimal string as an integer
    const codePoint = parseInt(hex, 16);

    // Use String.fromCodePoint() to convert the code point to a character
    return String.fromCodePoint(codePoint);
  } catch (error) {
    // Handle invalid input gracefully (e.g., non-hexadecimal input)
    console.error("Invalid input:", error);
    return null;
  }
}
