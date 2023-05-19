import { PerspectiveProxy, Literal, LinkQuery } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { Message } from "@fluxapp/api";
import { useState } from "preact/hooks";
import { useAgent, useEntry } from "@fluxapp/react-web";
import styles from "./MessageItem.module.css";
import { useEffect } from "preact/hooks";
import { community } from "@fluxapp/constants";

const { REPLY_TO } = community;

export default function MessageItem({
  showAvatar,
  agent,
  perspective,
  message,
  onEmojiClick = () => {},
  onReplyClick = () => {},
}: {
  perspective: PerspectiveProxy;
  showAvatar?: boolean;
  agent: AgentClient;
  message: Message;
  onEmojiClick?: (message: Message) => void;
  onReplyClick?: (message: Message) => void;
}) {
  const [replyId, setReplyId] = useState("");

  const { profile } = useAgent({ client: agent, did: message.author });

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

  const isFullVersion = replyId || showAvatar;

  return (
    <div className={styles.message}>
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
        {replyMessage?.id && (
          <j-flex a="center" gap="200">
            <j-avatar
              size="xxs"
              src={replyProfile?.profileThumbnailPicture}
              hash={replyMessage.author}
            ></j-avatar>
            <span>{replyProfile?.username}</span>
            <j-text
              size="300"
              nomargin
              dangerouslySetInnerHTML={{ __html: replyMessage.body }}
            ></j-text>
          </j-flex>
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
      </div>
      <div className={styles.toolbar}>
        <j-button
          onClick={() => onEmojiClick(message)}
          size="sm"
          square
          variant="ghost"
        >
          <j-icon size="sm" name="emoji-smile"></j-icon>
        </j-button>
        <j-button
          onClick={() => onReplyClick(message)}
          size="sm"
          square
          variant="ghost"
        >
          <j-icon size="sm" name="reply"></j-icon>
        </j-button>
      </div>
    </div>
  );
}
