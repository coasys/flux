import {
  useState,
  useContext,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "preact/hooks";
import { ChatContext } from "utils/frameworks/react";
import MessageItem from "../MessageItem";
import { getMe } from "utils/api";
import { differenceInMinutes } from "date-fns";
import tippy from "tippy.js";
import { Virtuoso } from "react-virtuoso";
import { h, Component, createRef } from "preact";
import ReactHintFactory from "react-hint";
import "react-hint/css/index.css";
import styles from "./index.scss";
import { Message, Reaction } from "utils/types";
import { REACTION } from "utils/constants";

const ReactHint = ReactHintFactory({ createElement: h, Component, createRef });

export default function MessageList({ perspectiveUuid, mainRef, channelId }) {
  const emojiPicker = useMemo(() => {
    const el = document.createElement("emoji-picker");
    el.classList.add(styles.picker);
    return el;
  }, []);

  const [atBottom, setAtBottom] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialScroll, setinitialScroll] = useState(false);
  const scroller = useRef();
  const [selectedReplies, setSelectedReplies] = useState<any>(null);

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

  async function loadMoreMessages(timestamp: any, backwards = false) {
    const fetchedMessageCount = await loadMore(timestamp, backwards);

    if (fetchedMessageCount > 0) {
      setTimeout(() => {
        scroller?.current?.scrollToIndex({
          index: fetchedMessageCount - 2,
          align: "start",
        });
      }, 0);
    }
  }

  const onReplyNavClick = (message: Message) => {
    setSelectedReplies(message);
    setShowModal(true);
  };

  const onReplyScroll = useCallback(
    async (message: Message) => {
      const reply = message.replies[0];

      const isReplyFound = messages.findIndex((e) => e.id === reply.id);

      if (isReplyFound !== -1) {
        setShowModal(false);

        setTimeout(() => {
          setSelectedReplies(null);
        }, 1000);

        scroller?.current?.scrollToIndex({
          index: isReplyFound,
          align: "center",
        });
      } else {
        await loadMoreMessages(reply.timestamp, true);

        setShowModal(false);

        scroller?.current?.scrollToIndex({
          index: 0,
          align: "start",
        });

        setTimeout(() => {
          setSelectedReplies(null);
        }, 1000);
      }
    },
    [messages]
  );

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
    });
    instance.show();
  }

  useEffect(() => {
    emojiPicker.addEventListener("emoji-click", onEmojiClick);

    return () => {
      emojiPicker.removeEventListener("emoji-click", onEmojiClick);
    };
  }, [messages, emojiPicker]);

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
      if (alreadyMadeReaction?.synced) {
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
      }
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
          Header: () => {
            const showEmpty = !isFetchingMessages && messages.length === 0;
            if (showEmpty) {
              return (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translateX(-50%) translateY(-50%)",
                  }}
                >
                  <j-box py="800">
                    <j-flex gap="400" direction="column" a="center" j="center">
                      <j-icon
                        color="ui-500"
                        size="xl"
                        name="chat-square-dots"
                      ></j-icon>
                      <j-flex direction="column" a="center">
                        <j-text nomargin color="black" size="700" weight="800">
                          No messages yet
                        </j-text>
                        <j-text size="400" weight="400">
                          Be the first to create one!
                        </j-text>
                      </j-flex>
                    </j-flex>
                  </j-box>
                </div>
              );
            }
            if (showLoadMore) {
              return (
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
              );
            }
            return (
              <j-box py="500">
                <j-flex a="center" j="center">
                  <j-text>You have reached the end...</j-text>
                </j-flex>
              </j-box>
            );
          },
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
        rangeChanged={rangeChanged}
        initialTopMostItemIndex={messages.length - 1}
        itemContent={(index, message) => (
          <MessageItem
            message={message}
            onOpenEmojiPicker={(unicode) => openEmojiPicker(unicode, index)}
            showAvatar={showAvatar(index)}
            mainRef={mainRef}
            perspectiveUuid={perspectiveUuid}
            onReplyNavClick={() => onReplyNavClick(message)}
            highlight={selectedReplies?.replies[0]?.id === message.id}
          />
        )}
      />
      {showModal && (
        <j-modal
          size="xs"
          open={showModal}
          onToggle={(e) => setShowModal(e.target.open)}
        >
          <j-box p="800">
            <j-flex gap="500" direction="column">
              <j-text nomargin variant="heading-sm">
                Reply
              </j-text>
              <MessageItem
                message={{
                  ...selectedReplies.replies[0],
                  editMessages: [
                    { content: selectedReplies.replies[0].content },
                  ],
                  replies: [],
                  reactions: [],
                }}
                showAvatar={true}
                mainRef={mainRef}
                perspectiveUuid={perspectiveUuid}
                hideToolbar={true}
                noPadding
              />
              <j-button
                onClick={() => onReplyScroll(selectedReplies)}
                size="sm"
                variant="subtle"
              >
                <j-icon size="xs" name="arrow-up"></j-icon>
                Go there
              </j-button>
            </j-flex>
          </j-box>
        </j-modal>
      )}
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
