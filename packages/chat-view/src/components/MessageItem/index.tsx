import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { AgentContext, ChatContext, PerspectiveContext } from "utils/react";
import getMe from "utils/api/getMe";
import getNeighbourhoodLink from "utils/api/getNeighbourhoodLink";
import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import UIContext from "../../context/UIContext";
import styles from "./index.scss";
import { format, formatRelative } from "date-fns/esm";
import { REACTION } from "utils/constants/ad4m";
import Skeleton from "../Skeleton";
import { Avatar } from "./Avatar";

type timeOptions = {
  dateStyle?: string;
  timeStyle?: string;
  dayPeriod?: string;
  timeZone?: string;
  weekday?: string;
  era?: string;
  year?: string;
  month?: string;
  day?: string;
  second?: string;
  hour?: string;
  minute?: string;
  hourCycle?: string;
  relative?: boolean;
};

export default function MessageItem({
  index,
  showAvatar,
  onOpenEmojiPicker,
  mainRef,
  perspectiveUuid,
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const messageRef = useRef<any>(null);
  const {
    state: { members },
  } = useContext(PerspectiveContext);
  const {
    state: { messages, keyedMessages },
    methods: { addReaction, removeReaction, hideMessageEmbeds },
  } = useContext(ChatContext);
  const [neighbourhoodCards, setNeighbourhoodCards] = useState<any[]>([]);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const { state: agentState } = useContext(AgentContext);

  const message = messages[index] || {
    id: "unknown",
    url: "",
    author: "",
    reactions: [],
    timestamp: "'1995-12-17T03:24:00'",
    content: "",
    replyUrl: "",
  };

  function onReplyClick() {
    setCurrentReply(message.id);
  }

  async function onEmojiClick(utf: string) {
    console.log({ utf });
    const me = await getMe();

    const alreadyMadeReaction = message.reactions.find((reaction) => {
      console.log({ reaction, utf });
      return reaction.author === me.did && reaction.content === utf;
    });

    if (alreadyMadeReaction) {
      removeReaction({
        author: alreadyMadeReaction.author,
        data: {
          predicate: REACTION,
          target: `emoji://${alreadyMadeReaction.content}`,
          source: message.id,
        },
        proof: {
          invalid: false,
          key: "",
          signature: "",
          valid: true,
        },
        timestamp: alreadyMadeReaction.timestamp,
      });
    } else {
      addReaction(message.id, utf);
    }
  }

  useEffect(() => {
    const mentionElements = (messageRef.current as any).querySelectorAll(
      "[data-mention]"
    );
    const emojiElements = (messageRef.current as any).querySelectorAll(
      ".emoji"
    );

    for (const ele of emojiElements) {
      const emoji = ele as HTMLElement;

      if (emoji.parentNode?.nodeName !== "J-TOOLTIP") {
        var wrapper = document.createElement("j-tooltip");
        wrapper.title = `:${emoji.dataset.id}:`;
        wrapper.classList.add("emojitoolip");
        (wrapper as any).placement = "top";
        emoji.parentNode?.insertBefore(wrapper, emoji);
        wrapper.appendChild(emoji);

        if (emoji.parentNode?.nextSibling?.textContent?.trim().length === 0) {
          emoji.parentNode?.nextSibling.remove();
        }
      }
    }

    for (const ele of mentionElements) {
      const mention = ele as HTMLElement;

      mention.addEventListener("click", () => {
        if (mention.innerText.startsWith("#")) {
          const event = new CustomEvent("perspective-click", {
            detail: {
              channel: mention.dataset["id"],
            },
            bubbles: true,
          });
          mainRef?.dispatchEvent(event);
        } else if (mention.innerText.startsWith("@")) {
          const event = new CustomEvent("agent-click", {
            detail: {
              did: mention.dataset["id"],
            },
            bubbles: true,
          });
          mainRef?.dispatchEvent(event);
        }
      });
    }
  }, [messageRef]);

  function onProfileClick(did) {
    const event = new CustomEvent("agent-click", {
      detail: {
        did,
      },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  function onLinkClick(link: any) {
    const event = new CustomEvent("perspective-click", {
      detail: {
        uuid: link.perspectiveUuid,
        channel: "Home",
        link,
      },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  useEffect(() => {
    getNeighbourhoodCards();
  }, [message]);

  useEffect(() => {
    getNeighbourhoodCards();
  }, [message.isNeighbourhoodCardHidden]);

  const getNeighbourhoodCards = async () => {
    const links = await getNeighbourhoodLink({
      perspectiveUuid,
      messageUrl: message.id,
      message: message.content,
      isHidden: message.isNeighbourhoodCardHidden,
    });

    setNeighbourhoodCards(links);
  };

  const author = members[message.author] || {};
  const replyAuthor = members[message?.replies[0]?.author] || {};
  const replyMessage = message?.replies[0];
  const popularStyle = message.isPopular? styles.popularMessage : "";

  return (
    <div
      onMouseOver={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      class={[styles.message, popularStyle].join(" ")}
      isReplying={keyedMessages[currentReply]?.id === message.id}
    >
      <div class={styles.messageItemWrapper}>
        {replyMessage && (
          <>
            <div class={styles.replyLineWrapper}>
              <div class={styles.replyLine} />
            </div>
            <div class={styles.messageFlex}>
              <div
                class={styles.messageFlex}
                onClick={() => onProfileClick(replyAuthor?.did)}
              >
                {replyAuthor?.did ? (
                  <Avatar author={replyAuthor} size="small" />
                ) : (
                  <Skeleton variant="circle" width={20} height={20} />
                )}
                {replyAuthor.username ? (
                  <div class={styles.messageUsernameNoMargin}>
                    {replyAuthor?.username}
                  </div>
                ) : (
                  <div style={{ marginBottom: 5 }}>
                    <Skeleton width={60} height={20} />
                  </div>
                )}
              </div>
              <div
                class={styles.replyContent}
                dangerouslySetInnerHTML={{ __html: replyMessage.content }}
              />
            </div>
          </>
        )}
        <div>
          {replyMessage || showAvatar ? (
            <j-flex>
              {author?.did ? (
                <Avatar
                  author={author}
                  onProfileClick={onProfileClick}
                ></Avatar>
              ) : (
                <Skeleton variant="circle" width={42} height={42} />
              )}
            </j-flex>
          ) : (
            <small
              class={styles.timestampLeft}
              data-rh
              data-timestamp={format(
                new Date(message.timestamp),
                "EEEE, MMMM d, yyyy, HH:MM"
              )}
            >
              {format(new Date(message.timestamp), "HH:MM ")}
            </small>
          )}
        </div>
        <div class={styles.messageItemContentWrapper}>
          {(replyMessage || showAvatar) && (
            <header class={styles.messageItemHeader}>
              {author?.username ? (
                <div
                  onClick={() => onProfileClick(author?.did)}
                  class={styles.messageUsername}
                >
                  {author?.username}
                </div>
              ) : (
                <div style={{ marginBottom: 5 }}>
                  <Skeleton width={60} height={20} />
                </div>
              )}
              <small
                class={styles.timestamp}
                data-rh
                data-timestamp={format(
                  new Date(message.timestamp),
                  "EEEE, MMMM d, yyyy, hh:mm b"
                )}
              >
                {formatRelative(new Date(message.timestamp), new Date())}
              </small>
            </header>
          )}

          <div
            ref={messageRef}
            class={styles.messageItemContent}
            dangerouslySetInnerHTML={{ __html: message.content }}
          ></div>
          {message.reactions.length > 0 && (
            <j-box pt="400">
              <MessageReactions
                onEmojiClick={onEmojiClick}
                reactions={message.reactions}
              />
            </j-box>
          )}
          {neighbourhoodCards.length > 0 && (
            <div style={{ position: "relative" }}>
              {neighbourhoodCards.map((e) => (
                <div
                  class={styles.neighbourhoodCards}
                  size="300"
                  onClick={() => onLinkClick(e)}
                >
                  <j-text variant="footnote">Neighbourhood</j-text>
                  <j-text>{e.name}</j-text>
                  {e.description && e.description !== "-" && (
                    <j-text>{e.description}</j-text>
                  )}
                </div>
              ))}
              {agentState.did === message.author && (
                <div
                  class={styles.neighbourhoodCardsClose}
                  onClick={() => hideMessageEmbeds(message.id)}
                >
                  <j-icon name="x"></j-icon>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          {showToolbar && (
            <MessageToolbar
              onReplyClick={onReplyClick}
              onOpenEmojiPicker={onOpenEmojiPicker}
            />
          )}
        </div>
      </div>
    </div>
  );
}
