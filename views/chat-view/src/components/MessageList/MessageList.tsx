import { useSubjects } from "@coasys/flux-react-web";
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

function generateHashSync(str1, str2) {
  const combinedString = str1 + str2;

  function hashString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
    }
    return hash.toString(16).padStart(2, "0");
  }

  const hash = hashString(combinedString);

  return hash;
}

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
  const showButtonTimeoutRef = useRef(null);
  const [showButton, setShowButton] = useState(false);
  const [page, setPage] = useState(1);

  const uniqueKey = useRef(generateHashSync(perspective.uuid, source));

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

  const { entries, setQuery, isMore, isLoading } = useSubjects({
    perspective,
    source,
    subject: Message,
    query: {
      page,
      size: PAGE_SIZE,
      infinite: true,
      uniqueKey: uniqueKey.current,
    },
  });

  const messages = useMemo(() => {
    return entries
      .slice()
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [entries]);

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
        components={{
          Header: () => {
            if (isLoading)
              return (
                <div className={styles.loadMore}>
                  <j-spinner></j-spinner>
                </div>
              );

            return (
              isMore && (
                <div className={styles.loadMore}>
                  <j-button
                    variant="subtle"
                    onClick={() => {
                      setQuery({
                        page: page + 1,
                        size: PAGE_SIZE,
                        infinite: true,
                        uniqueKey: uniqueKey.current,
                      });

                      setPage(page + 1);
                    }}
                  >
                    load more
                  </j-button>
                </div>
              )
            );
          },
        }}
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
