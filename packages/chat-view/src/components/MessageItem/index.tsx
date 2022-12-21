import { useContext, useMemo, useEffect, useRef, useState } from "preact/hooks";
import { AgentContext, ChatContext, CommunityContext } from "utils/react";
import getMe from "utils/api/getMe";
import getNeighbourhoodLink from "utils/api/getNeighbourhoodLink";
import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import MessageReply from "./MessageReply";
import UIContext from "../../context/UIContext";
import styles from "./index.scss";
import { format, formatRelative } from "date-fns/esm";
import { REACTION } from "utils/constants/communityPredicates";
import Avatar from "../../components/Avatar";
import EditorContext from "../../context/EditorContext";
import { Message, Profile } from "utils/types";
import NeighbourhoodCard from "./NeighbourhoodCard";
import LinkCard from "./LinkCard";

function Card({
  type,
  image,
  url,
  mainRef,
  name,
  description,
  onClick,
  perspectiveUuid,
}) {
  function onNeighbourhoodClick(url: string) {
    const event = new CustomEvent("neighbourhood-click", {
      detail: { url, channel: "Home" },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  function onLinkClick(url: string) {
    window.open(url, "_blank");
  }

  if (type === "neighbourhood") {
    return (
      <NeighbourhoodCard
        onClick={() => onNeighbourhoodClick(url)}
        name={name}
        description={description}
        perspectiveUuid={perspectiveUuid}
      />
    );
  } else if (type === "link") {
    return (
      <LinkCard
        onClick={() => onLinkClick(url)}
        name={name}
        description={description}
        image={image}
      />
    );
  }
}

export default function MessageItem({
  message,
  showAvatar,
  onOpenEmojiPicker,
  mainRef,
  perspectiveUuid,
  hideToolbar = false,
  noPadding = false,
  highlight = false,
  onReplyNavClick = () => null,
}) {
  const messageContent =
    message.editMessages[message.editMessages.length - 1].content;

  const messageRef = useRef<any>(null);

  const [showToolbar, setShowToolbar] = useState(false);

  const {
    state: { members },
  } = useContext(CommunityContext);

  const {
    methods: { addReaction, removeReaction },
  } = useContext(ChatContext);

  const [neighbourhoodCards, setNeighbourhoodCards] = useState<any[]>([]);

  const {
    state: { currentReply, currentMessageEdit },
    methods: { setCurrentReply, setCurrentEditMessage },
  } = useContext(UIContext);

  const {
    methods: { setInputValue },
  } = useContext(EditorContext);

  const { state: agentState } = useContext(AgentContext);

  function onReplyClick() {
    setCurrentReply(message.id);
  }

  function onEditClick() {
    setCurrentEditMessage(message.id);
    setInputValue(messageContent);
  }

  async function onEmojiClick(utf: string) {
    const me = await getMe();

    const alreadyMadeReaction = message.reactions.find((reaction) => {
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

  function onMessageClick(e) {
    const { mention, id } = e.target.dataset;

    if (mention === "agent") {
      onProfileClick(id);
    }

    if (mention === "neighbourhood") {
      const url = e.target.innerText;
      onNeighbourhoodClick(url);
    }

    if (mention === "channel") {
      onChannnelClick(id);
    }
  }

  function onChannnelClick(channel: string) {
    const event = new CustomEvent("channel-click", {
      detail: { channel },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  function onProfileClick(did: string) {
    const event = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  function onNeighbourhoodClick(url: string) {
    const event = new CustomEvent("neighbourhood-click", {
      detail: { url, channel: "Home" },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  useEffect(() => {
    getNeighbourhoodCards();
  }, [message.id]);

  useEffect(() => {
    getNeighbourhoodCards();
  }, [message.isNeighbourhoodCardHidden]);

  const getNeighbourhoodCards = async () => {
    const links = await getNeighbourhoodLink({
      perspectiveUuid,
      messageUrl: message.id,
      message: messageContent,
      isHidden: message.isNeighbourhoodCardHidden,
    });

    setNeighbourhoodCards(links);
  };

  const author: Profile = members[message.author] || {};
  const replyAuthor: Profile = members[message?.replies[0]?.author] || {};
  const replyMessage: Message = message?.replies[0];
  const popularStyle: string = message.isPopular ? styles.popularMessage : "";
  const highlightStyle: string = highlight ? styles.highlightMessage : "";
  const noPaddingStyle: string = noPadding ? styles.noPaddingStyle : "";
  const isReplying: boolean = currentReply === message.id;
  const isEdited: boolean = message.editMessages.length > 1;
  const hasReactions: boolean = message.reactions.length > 0;
  const showAuthor: boolean = replyMessage || showAvatar;

  return (
    <div
      class={[
        styles.message,
        popularStyle,
        noPaddingStyle,
        highlightStyle,
        !message.synced ? styles.messageNotSynced : "",
      ].join(" ")}
      isReplying={isReplying}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      <div class={styles.messageItemWrapper}>
        {replyMessage && (
          <MessageReply
            onProfileClick={onProfileClick}
            replyAuthor={replyAuthor}
            replyMessage={replyMessage}
            onMessageClick={onReplyNavClick}
          ></MessageReply>
        )}
        <div>
          {showAuthor ? (
            <Avatar
              onClick={() => onProfileClick(author?.did)}
              did={author?.did}
              url={author?.profileThumbnailPicture}
            />
          ) : (
            showToolbar && (
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
            )
          )}
        </div>

        <div class={styles.messageItemContentWrapper}>
          {showAuthor && (
            <header class={styles.messageItemHeader}>
              <div
                onClick={() => onProfileClick(author?.did)}
                class={styles.messageUsername}
              >
                {author?.username || (
                  <j-skeleton width="xl" height="text"></j-skeleton>
                )}
              </div>
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
            onClick={onMessageClick}
            ref={messageRef}
            class={styles.messageItemContent}
            style={{ display: "inline-flex" }}
            dangerouslySetInnerHTML={{
              __html: messageContent,
            }}
          ></div>

          {isEdited && (
            <small
              data-rh
              data-timestamp={format(
                new Date(
                  message.editMessages[
                    message.editMessages.length - 1
                  ].timestamp
                ),
                "EEEE, MMMM d, yyyy, hh:mm b"
              )}
              class={styles.timestamp}
              style={{ display: "inline-flex" }}
            >
              &nbsp;(edited)
            </small>
          )}

          {hasReactions && (
            <MessageReactions
              onEmojiClick={onEmojiClick}
              reactions={message.reactions}
            />
          )}

          {neighbourhoodCards.map((e) => (
            <Card
              type={e.type}
              mainRef
              onClick={() => onNeighbourhoodClick(e.url)}
              name={e.name}
              description={e.description}
              perspectiveUuid={e.perspectiveUuid}
              url={e.url}
              image={e.image}
            ></Card>
          ))}
        </div>

        {!hideToolbar && showToolbar && (
          <div class={styles.toolbarWrapper}>
            <MessageToolbar
              onReplyClick={onReplyClick}
              onOpenEmojiPicker={onOpenEmojiPicker}
              onEditClick={onEditClick}
              showEditIcon={agentState.did === message.author}
            />
          </div>
        )}
      </div>
    </div>
  );
}
