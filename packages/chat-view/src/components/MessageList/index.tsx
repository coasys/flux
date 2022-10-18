import { useState, useContext, useRef, useEffect } from "preact/hooks";
import { ChatContext } from "utils/react";
import MessageItem from "../MessageItem";
import getMe from "utils/api/getMe";
import { differenceInMinutes, parseISO } from "date-fns";
import tippy from "tippy.js";
import { Virtuoso } from "react-virtuoso";
import { h, Component, createRef } from "preact";
import ReactHintFactory from "react-hint";
const ReactHint = ReactHintFactory({ createElement: h, Component, createRef });
import "react-hint/css/index.css";
import styles from "./index.scss";
import { Reaction } from "utils/types";
import { REACTION } from "utils/constants/communityPredicates";

export default function MessageList({ perspectiveUuid, mainRef, channelId }) {
  const emojiPicker = useRef(document.createElement("emoji-picker"));
  emojiPicker.current.classList.add(styles.picker);
  const [atBottom, setAtBottom] = useState(true);
  const [initialScroll, setinitialScroll] = useState(false);
  const scroller = useRef();

  const {
    state: {
      messages,
      isFetchingMessages,
      scrollPosition,
      hasNewMessage,
      isMessageFromSelf,
      showLoadMore,
    },
    methods: {
      loadMore,
      removeReaction,
      addReaction,
      saveScrollPos,
      setHasNewMessage,
      setIsMessageFromSelf,
    },
  } = useContext(ChatContext);

  useEffect(() => {
    if (scroller.current && messages.length > 0 && !initialScroll) {
      if (!scrollPosition) {
        scroller.current.scrollToIndex({
          index: messages.length,
        });
      } else {
        scroller.current.scrollToIndex({
          index: scrollPosition,
        });
      }

      setinitialScroll(true);
    }
  }, [messages, initialScroll, scrollPosition]);

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
              parseISO(message.timestamp),
              parseISO(previousMessage.timestamp)
            ) >= 2;
    }
  }

  function openEmojiPicker(e: any, index: number) {
    emojiPicker.current.setAttribute("message-index", index.toString());
    const instance = tippy(e.target as HTMLElement, {
      content: emojiPicker.current,
      trigger: "click",
      appendTo: document.body,
      interactive: true,
      onShow: () => {
        emojiPicker.current.addEventListener("emoji-click", onEmojiClick);
      },
      onHide: () => {
        emojiPicker.current.removeEventListener("emoji-click", onEmojiClick);
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
      saveScrollPos(startIndex);
      setIsMessageFromSelf(false);
    }
  };

  useEffect(() => {
    if (mainRef && perspectiveUuid && channelId) {
      let options = {
        root: document.querySelector(".sidebar-layout__main"),
        rootMargin: "0px",
        threshold: 1.0,
      };

      let observer = new IntersectionObserver(() => {
        if (atBottom) {
          const event = new CustomEvent("hide-notification-indicator", {
            detail: { uuid: channelId },
            bubbles: true,
          });
          mainRef?.dispatchEvent(event);
        }
      }, options);

      if (mainRef) {
        observer.observe(mainRef);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [atBottom, mainRef, channelId, perspectiveUuid]);

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
        ref={scroller}
        alignToBottom
        startReached={() => console.log("start reached")}
        atBottomStateChange={(bool) => {
          if (atBottom === bool) {
            return;
          }
          if (bool) {
            setHasNewMessage(false);
          }
          setAtBottom(bool);
        }}
        style={{ height: "100%", overflowX: "hidden" }}
        overscan={20}
        totalCount={messages.length}
        rangeChanged={rangeChanged}
        initialTopMostItemIndex={scrollPosition || 0}
        itemContent={(index) => {
          return (
            <MessageItem
              onOpenEmojiPicker={(unicode) => openEmojiPicker(unicode, index)}
              showAvatar={showAvatar(index)}
              index={index}
              mainRef={mainRef}
              perspectiveUuid={perspectiveUuid}
            />
          );
        }}
      />
      <ReactHint
        position="right"
        className={styles.reactHint}
        events={{ hover: true }}
        onRenderContent={(target) => (
          <>
            <span>{target.dataset["timestamp"]}</span>
            <div class={styles.arrow}></div>
          </>
        )}
      />
    </main>
  );
}
