import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { Message } from "@fluxapp/api";
import { useAgent, useEntry } from "@fluxapp/react-web";
import styles from "./MessageItem.module.css";
import { community } from "@fluxapp/constants";

export default function MessageItem({
  perspective,
  showAvatar,
  agent,
  message,
}: {
  perspective: PerspectiveProxy;
  showAvatar?: boolean;
  agent: AgentClient;
  message: Message;
}) {
  const { profile } = useAgent({ client: agent, did: message.author });

  function addReply(emoji: string) {
    perspective.add({
      source: message.id,
      predicate: community.REACTION,
      target: Literal.from(emoji).toUrl(),
    });
  }

  return (
    <div className={styles.message}>
      <div className={styles.messageLeft}>
        {showAvatar && (
          <j-avatar
            size="md"
            src={profile?.profileThumbnailPicture}
            hash={message.author}
          ></j-avatar>
        )}
      </div>
      <div className={styles.messageRight}>
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
        <div
          className={styles.messageBody}
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
          onclick={() => addReply("😊")}
          size="sm"
          square
          variant="ghost"
        >
          <j-icon size="sm" name="emoji-smile"></j-icon>
        </j-button>
        <j-button size="sm" square variant="ghost">
          <j-icon size="sm" name="emoji-smile"></j-icon>
        </j-button>
      </div>
    </div>
  );
}
