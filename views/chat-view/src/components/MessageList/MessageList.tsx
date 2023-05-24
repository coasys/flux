import { useEntries } from "@fluxapp/react-web";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { Message } from "@fluxapp/api";
import { Virtuoso } from "react-virtuoso";
import MessageItem from "../MessageItem";
import styles from "./MessageList.module.css";
import { useEffect, useRef, useState } from "preact/hooks";

type Props = {
  perspective: PerspectiveProxy;
  agent: AgentClient;
  source: string;
  replyId: string | undefined | null;
  isThread?: boolean;
  onEmojiClick?: (message: Message, position: { x: number; y: number }) => void;
  onReplyClick?: (message: Message) => void;
  onThreadClick?: (message: Message) => void;
};

export default function MessageList({
  perspective,
  agent,
  source,
  replyId,
  isThread,
  onEmojiClick = () => {},
  onReplyClick = () => {},
  onThreadClick = () => {},
}: Props) {
  const virtuosoRef = useRef(null);
  const [atBottom, setAtBottom] = useState(false);
  const showButtonTimeoutRef = useRef(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    return () => {
      clearTimeout(showButtonTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(showButtonTimeoutRef.current);
    if (!atBottom) {
      showButtonTimeoutRef.current = setTimeout(() => setShowButton(true), 500);
    } else {
      setShowButton(false);
    }
  }, [atBottom, setShowButton]);

  const { entries: messages } = useEntries({
    perspective,
    source,
    model: Message,
  });

  console.log({ messages });

  function showAvatar(index: number): boolean {
    const previousMessage = messages[index - 1];
    const message = messages[index];

    if (!previousMessage || !message) {
      return true;
    }

    return previousMessage.author !== message.author
      ? true
      : previousMessage.author === message.author &&
          differenceInMinutes(
            new Date(message.timestamp),
            new Date(previousMessage.timestamp)
          ) >= 2;
  }

  return (
    <div className={styles.messageList}>
      {showButton && (
        <j-button
          circle
          squared
          variant="primary"
          onClick={() =>
            virtuosoRef.current.scrollToIndex({
              index: messages.length - 1,
              behavior: "smooth",
            })
          }
          style={{
            position: "absolute",
            right: "var(--j-space-500)",
            zIndex: 10,
            bottom: "var(--j-space-300)",
            transform: "translate(-1rem, -2rem)",
          }}
        >
          <j-icon size="sm" name="arrow-down"></j-icon>
        </j-button>
      )}
      <Virtuoso
        ref={virtuosoRef}
        followOutput={"auto"}
        atBottomStateChange={setAtBottom}
        className={styles.scroller}
        alignToBottom
        overscan={{ main: 1000, reverse: 1000 }}
        atBottomThreshold={10}
        computeItemKey={(index) => messages[index].id}
        totalCount={messages.length}
        initialTopMostItemIndex={messages.length - 1}
        itemContent={(index) => {
          return (
            <MessageItem
              isReplying={messages[index].id === replyId}
              perspective={perspective}
              showAvatar={showAvatar(index)}
              key={messages[index].id}
              agent={agent}
              message={messages[index]}
              isThread={isThread}
              onEmojiClick={onEmojiClick}
              onReplyClick={onReplyClick}
              onThreadClick={onThreadClick}
            ></MessageItem>
          );
        }}
      />
    </div>
  );
}

function differenceInMinutes(
  timestamp1: string | number | Date,
  timestamp2: string | number | Date
): number {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const differenceInMilliseconds = date1.getTime() - date2.getTime();
  const differenceInMinutes = differenceInMilliseconds / (1000 * 60);

  return Math.floor(differenceInMinutes);
}
