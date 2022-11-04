import { useState, useContext, useRef, useMemo } from "preact/hooks";
import { ChatContext } from "utils/react";
import MessageItem from "../MessageItem";
import Header from "../Header";
import { Virtuoso } from "react-virtuoso";
import { h } from "preact";
import "react-hint/css/index.css";
import styles from "./index.scss";
import EditorContext from "../../context/EditorContext";

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
      messages: orderedMessages,
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

  const messages = [...orderedMessages.reverse()];

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
        scrollToBottom();
      }
    });
  }

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
          Header: Header,
          Footer: () =>
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
        overscan={{ main: 1000, reverse: 1000 }}
        atBottomThreshold={10}
        computeItemKey={(index, message) => message.id}
        endReached={() => handleAtBottom(true)}
        atBottomStateChange={handleAtBottom}
        data={messages}
        initialTopMostItemIndex={0}
        itemContent={(index, message) => (
          <MessageItem
            message={message}
            mainRef={mainRef}
            perspectiveUuid={perspectiveUuid}
          />
        )}
      />
    </main>
  );
}
