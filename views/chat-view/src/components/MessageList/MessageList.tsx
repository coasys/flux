import { useAd4mModel } from "@coasys/flux-utils/src/useAd4mModel";
// import { useAd4mModel } from "@coasys/ad4m-react-hooks";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { PerspectiveProxy } from "@coasys/ad4m";
import { Message } from "@coasys/flux-api";
import { Virtuoso } from "react-virtuoso";
import MessageItem from "../MessageItem";
import { useMemo } from "preact/hooks";
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

const PAGE_SIZE = 30;

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
  const [showButton, setShowButton] = useState(false);
  const showButtonTimeoutRef = useRef(null);

  const { entries, loading, totalCount, loadMore } = useAd4mModel({
    perspective,
    model: Message,
    query: { source, order: { timestamp: "DESC" } },
    pageSize: PAGE_SIZE,
  });

  const messages = useMemo(() => {
    // Reverse order after pagination for inverted message scrolling
    return entries.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [JSON.stringify(entries)]);

  function differenceInMinutes(timestamp1: string | number | Date, timestamp2: string | number | Date): number {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    const differenceInMilliseconds = date1.getTime() - date2.getTime();
    const differenceInMinutes = differenceInMilliseconds / (1000 * 60);
    return Math.floor(differenceInMinutes);
  }

  function showAvatar(index: number): boolean {
    const previousMessage = messages[index - 1];
    const message = messages[index];
    // Always show avatar if this is the first message or messages are invalid
    if (!previousMessage || !message) return true;
    // Show avatar if author changed
    if (previousMessage.author !== message.author) return true;
    // For same author, show avatar if messages are separated by ≥ 2 minutes
    const timeDifference = differenceInMinutes(new Date(message.timestamp), new Date(previousMessage.timestamp));

    return timeDifference >= 2;
  }

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
        components={{
          Header: () => {
            if (loading)
              return (
                <div className={styles.loadMore}>
                  <j-spinner></j-spinner>
                </div>
              );

            if (totalCount > messages.length)
              return (
                <div className={styles.loadMore}>
                  <j-button variant="subtle" onClick={loadMore}>
                    load more
                    <j-text nomargin>({totalCount - messages.length})</j-text>
                  </j-button>
                </div>
              );
          },
        }}
        ref={virtuosoRef}
        followOutput={"smooth"}
        atBottomStateChange={setAtBottom}
        className={styles.scroller}
        alignToBottom
        overscan={{ main: 1000, reverse: 1000 }}
        atBottomThreshold={10}
        computeItemKey={(index) => messages[index].baseExpression}
        totalCount={messages.length}
        initialTopMostItemIndex={messages.length - 1}
        itemContent={(index) => {
          return (
            <MessageItem
              isReplying={messages[index].baseExpression === replyId}
              perspective={perspective}
              showAvatar={showAvatar(index)}
              key={messages[index].baseExpression}
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
