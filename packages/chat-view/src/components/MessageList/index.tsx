import {
  useState,
  useContext,
  useRef,
  useEffect,
  useMemo
} from "preact/hooks";
import { ChatContext } from "utils/react";
import MessageItem from "../MessageItem";
import getMe from "utils/api/getMe";
import { differenceInMinutes } from "date-fns";
import tippy from "tippy.js";
import { Virtuoso } from "react-virtuoso";
import { h, Component, createRef } from "preact";
import ReactHintFactory from "react-hint";
import "react-hint/css/index.css";
import styles from "./index.scss";
import { Reaction } from "utils/types";
import EditorContext from "../../context/EditorContext";

import { REACTION } from "utils/constants/communityPredicates";

const ReactHint = ReactHintFactory({ createElement: h, Component, createRef });

export default function MessageList({ perspectiveUuid, mainRef, channelId }) {
  const emojiPicker = useMemo(() => {
    const el = document.createElement("emoji-picker");
    el.classList.add(styles.picker);
    return el;
  }, []);

  const [atBottom, setAtBottom] = useState(false);
  const [initialScroll, setinitialScroll] = useState(false);
  const scroller = useRef();
  const {
    state: { editor },
  } = useContext(EditorContext);

  const {
    state: {
      messages,
      isFetchingMessages,
      hasNewMessage,
      isMessageFromSelf,
      showLoadMore,
    },
    methods: {
      loadMore,
      removeReaction,
      addReaction,
      setHasNewMessage,
      setIsMessageFromSelf,
    },
  } = useContext(ChatContext);

  useEffect(() => {
    if (atBottom && hasNewMessage) {
      scrollToBottom();
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: channelId },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
  }, [hasNewMessage, atBottom]);

  useEffect(() => {
    if (isMessageFromSelf) {
      scrollToBottom();
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: channelId },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
  }, [isMessageFromSelf]);

  useEffect(() => {
    if (atBottom) {
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: channelId },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
  }, [atBottom]);

  function scrollToBottom() {
    if (scroller.current) {
      scroller.current.scrollToIndex({
        index: messages.length - 1,
      });
      setHasNewMessage(false);
    }
  }

  function loadMoreMessages() {
    loadMore().then((fetchedMessageCount) => {
      if (fetchedMessageCount > 0) {
        scroller?.current?.scrollToIndex({
          index: fetchedMessageCount - 1,
          align: "end",
        });
      }
    });
  }

  function showAvatar(index: number): boolean {
    const previousMessage = messages[index - 1];
    const message = messages[index];

    if (!previousMessage || !message) {
      return true;
    } else {
      return previousMessage.author !== message.author
        ? true
        : previousMessage.author === message.author &&
            differenceInMinutes(
              new Date(message.timestamp),
              new Date(previousMessage.timestamp)
            ) >= 2;
    }
  }

  function openEmojiPicker(e: any, index: number) {
    emojiPicker.setAttribute("message-index", index.toString());
    const instance = tippy(e.target as HTMLElement, {
      content: emojiPicker,
      trigger: "click",
      appendTo: document.body,
      interactive: true,
      onShow: () => {
        emojiPicker.addEventListener("emoji-click", onEmojiClick);
      },
      onHide: () => {
        emojiPicker.removeEventListener("emoji-click", onEmojiClick);
      },
    });
    instance.show();
  }

  async function onEmojiClick(e: any) {
    const unicode = e.detail.unicode;
    const utf = unicode.codePointAt(0).toString(16);

    const index = e.target.getAttribute("message-index");
    const message = messages[parseInt(index)];

    const me = await getMe();

    const alreadyMadeReaction = message.reactions.find((reaction: Reaction) => {
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

  const rangeChanged = ({ startIndex, endIndex }) => {
    if (typeof startIndex === "number" && initialScroll) {
      setIsMessageFromSelf(false);
    }
  };

  function handleAtBottom(bool) {
    if (atBottom === bool) {
      return;
    }

    if (bool) {
      setHasNewMessage(false);
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: channelId },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
    setAtBottom(bool);
  }

  return (
    <main class={styles.main}>
      {hasNewMessage && !atBottom && (
        <j-button
          class={styles.newMessagesButton}
          variant="primary"
          onClick={scrollToBottom}
        >
          New messages
        </j-button>
      )}
      <Virtuoso
        components={{
          Header: () =>
            showLoadMore ? (
              <j-box py="500">
                <j-flex a="center" j="center">
                  {isFetchingMessages ? (
                    <j-flex a="center" gap="300">
                      <span>Loading</span>
                      <j-spinner size="xxs"></j-spinner>
                    </j-flex>
                  ) : (
                    <j-button
                      size="sm"
                      onClick={loadMoreMessages}
                      variant="subtle"
                    >
                      Load more
                    </j-button>
                  )}
                </j-flex>
              </j-box>
            ) : (
              <j-box py="500">
                <j-flex a="center" j="center">
                  <j-text>You have reached the end...</j-text>
                </j-flex>
              </j-box>
            ),
        }}
        style={{ height: "100%", overflowX: "hidden" }}
        ref={scroller}
        alignToBottom
        overscan={{main: 1000, reverse: 1000}}
        atBottomThreshold={10}
        computeItemKey={(index, message) => message.id}
        endReached={() => handleAtBottom(true)}
        atBottomStateChange={handleAtBottom}
        data={messages}
        rangeChanged={rangeChanged}
        initialTopMostItemIndex={messages.length - 1}
        itemContent={(index, message) => (
          <MessageItem
            message={message}
            onOpenEmojiPicker={(unicode) => openEmojiPicker(unicode, index)}
            showAvatar={showAvatar(index)}
            mainRef={mainRef}
            perspectiveUuid={perspectiveUuid}
          />
        )}
      />
      <ReactHint
        position="right"
        className={styles.reactHintWrapper}
        events={{ hover: true }}
        onRenderContent={(target) => {
          const content = target.dataset["timestamp"];
          if (content) {
            return (
              <div className={styles.reactHint}>
                <span>{content}</span>
                <div class={styles.arrow}></div>
              </div>
            );
          }
        }}
      />
    </main>
  );
}
