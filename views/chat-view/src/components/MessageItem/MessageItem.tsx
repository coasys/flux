import { LinkQuery, PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Message } from "@coasys/flux-api";
import { REACTION } from "@coasys/flux-constants/src/communityPredicates";
import { Profile } from "@coasys/flux-types";
import { useEffect, useState } from "preact/hooks";
import styles from "./MessageItem.module.css";

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
  hideToolbar = false,
  getProfile,
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
  hideToolbar?: boolean;
  getProfile: (did: string) => Promise<any>;
}) {
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [replyProfile, setReplyProfile] = useState<Profile | null>(null);

  function onOpenPicker(e) {
    e.stopPropagation();
    onEmojiClick(message, { x: e.clientX, y: e.clientY });
  }

  const isFullVersion = message.replyingTo || showAvatar;

  const reactionCounts = message.reactions.reduce((acc, reaction) => {
    return {
      ...acc,
      [reaction]: acc[reaction] ? acc[reaction] + 1 : 1,
    };
  }, {});

  async function onTogggleEmoji(expression) {
    const me = await agent.me();
    const reactions = await perspective.get(
      new LinkQuery({
        source: message.baseExpression,
        predicate: REACTION,
        target: expression,
      })
    );

    const myReactions = reactions.filter((l) => l.author === me.did);

    if (myReactions.length > 0) {
      perspective.removeLinks(myReactions);
    } else {
      perspective.add({
        source: message.baseExpression,
        predicate: REACTION,
        target: expression,
      });
    }
  }

  async function getAuthorProfile() {
    const profileData = await getProfile(message.author);
    setProfile(profileData);
  }

  async function getReplyMessage() {
    try {
      const replies = await Message.findAll(perspective, { where: { base: message.replyingTo } });
      if (replies[0]) {
        setReplyMessage(replies[0]);
        setReplyProfile(await getProfile(replies[0].author));
      }
    } catch (error) {
      console.error("Failed to fetch reply message:", error);
    }
  }

  useEffect(() => {
    getAuthorProfile();
    if (message.replyingTo) getReplyMessage();
  }, []);

  return (
    <div className={`${styles.message} ${isReplying && styles.isReplying} ${message.isPopular && styles.isPopular}`}>
      {message.replyingTo && (
        <>
          <div></div>
          <div>
            <j-text nomargin size="300" color="ui-400">
              <j-icon size="xs" name="reply-fill" />
              {profile?.username} replied to {replyProfile?.username}
            </j-text>
            <j-box pb="300">
              <j-text
                size="300"
                className={styles.body}
                nomargin
                dangerouslySetInnerHTML={{ __html: replyMessage?.body }}
              />
            </j-box>
          </div>
        </>
      )}
      <div>{isFullVersion && <j-avatar hash={message.author} src={profile?.profileThumbnailPicture} />}</div>
      <div>
        {isFullVersion && (
          <header className={styles.header}>
            <a href={message.author} className={styles.username}>
              {profile?.username}
            </a>
            <j-timestamp className={styles.timestamp} relative value={message.timestamp} />
          </header>
        )}
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: message.body }}></div>
        {message.reactions.length > 0 && (
          <div className={styles.reactions}>
            {Object.entries(reactionCounts).map(([emoji, count]) => {
              if (!emoji.startsWith("emoji://")) return null;
              return (
                <span className={styles.reaction} onClick={() => onTogggleEmoji(emoji)}>
                  {hexToEmoji(emoji.split("emoji://")[1])}
                </span>
              );
            })}
          </div>
        )}
        {message.thread?.length > 0 && (
          <j-box py="300">
            <button className={styles.threadButton} onClick={() => onThreadClick(message)}>
              Replies ({message.thread.length})
            </button>
          </j-box>
        )}
      </div>
      {!hideToolbar && (
        <div className={styles.toolbar}>
          <j-tooltip placement="top" title="Add reaction">
            <j-button onClick={onOpenPicker} size="sm" square variant="ghost">
              <j-icon size="sm" name="emoji-smile"></j-icon>
            </j-button>
          </j-tooltip>
          <j-tooltip placement="top" title="Reply in thread">
            <j-button onClick={() => onThreadClick(message)} size="sm" square variant="ghost">
              <j-icon size="sm" name="chat-text"></j-icon>
            </j-button>
          </j-tooltip>
          <j-tooltip placement="top" title="Reply">
            <j-button onClick={() => onReplyClick(message)} size="sm" square variant="ghost">
              <j-icon size="sm" name="reply"></j-icon>
            </j-button>
          </j-tooltip>
        </div>
      )}
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
