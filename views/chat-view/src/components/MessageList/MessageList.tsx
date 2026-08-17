import { PerspectiveProxy } from '@coasys/ad4m';
import { useLiveQuery } from '@coasys/ad4m-react-hooks';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Channel, Message } from '@coasys/flux-api';
import { fluxDebug, fluxDebugWarn } from '@coasys/flux-utils';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Virtuoso } from 'react-virtuoso';
import MessageItem from '../MessageItem';
import styles from './MessageList.module.css';

type Props = {
  perspective: PerspectiveProxy;
  agent: AgentClient;
  source: string;
  replyId: string | undefined | null;
  isThread?: boolean;
  onEmojiClick?: (message: Message, position: { x: number; y: number }) => void;
  onReplyClick?: (message: Message) => void;
  onThreadClick?: (message: Message) => void;
  getProfile: (did: string) => Promise<any>;
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
  getProfile,
}: Props) {
  const virtuosoRef = useRef(null);
  const [atBottom, setAtBottom] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const showButtonTimeoutRef = useRef(null);

  const {
    data: entries,
    loading,
    error,
    totalCount,
    loadMore,
  } = useLiveQuery(Message, perspective, {
    parent: isThread ? { model: Message, id: source, field: 'thread' } : { model: Channel, id: source },
    query: { order: { createdAt: 'DESC' } },
    pageSize: PAGE_SIZE,
  });

  // Debug: trace every state transition on the message-list query.
  // Silent-empty results are the exact failure mode we're chasing against
  // the AD4M typed-RDF-literals branch (coasys/ad4m#874) — messages disappear
  // with no error. This lets us see whether entries.length went 0, whether
  // totalCount is meaningful, and whether an error is being swallowed.
  useEffect(() => {
    fluxDebug('MessageList', 'query.state', {
      source,
      isThread: !!isThread,
      parentModel: isThread ? 'Message.thread' : 'Channel',
      perspectiveUuid: perspective?.uuid,
      loading,
      error: error || null,
      entriesLength: entries.length,
      totalCount,
      firstEntryId: entries[0]?.id,
      firstEntryBodyLen: entries[0]?.body?.length ?? null,
    });
    if (!loading && !error && entries.length === 0 && totalCount === 0) {
      fluxDebugWarn('MessageList', 'query.empty-no-error', {
        source,
        parent: isThread ? { model: 'Message', id: source, field: 'thread' } : { model: 'Channel', id: source },
        hint: 'useLiveQuery returned no messages and no error — check parent scope resolution, SPARQL bindings, and typed-literal storage on Message.body.',
      });
    }
  }, [source, isThread, perspective?.uuid, loading, error, entries.length, totalCount]);

  const messages = useMemo(() => {
    // Reverse order after pagination for inverted message scrolling
    return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [entries]);

  function differenceInMinutes(createdAt1: string | number | Date, createdAt2: string | number | Date): number {
    const date1 = new Date(createdAt1);
    const date2 = new Date(createdAt2);
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
    const timeDifference = differenceInMinutes(new Date(message.createdAt), new Date(previousMessage.createdAt));

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
          variant="primary"
          onClick={() => virtuosoRef.current.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' })}
          style={{
            position: 'absolute',
            right: 'var(--j-space-500)',
            zIndex: 10,
            bottom: 'var(--j-space-300)',
            transform: 'translate(-1rem, -2rem)',
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
                  <j-spinner />
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
        followOutput={'smooth'}
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
              getProfile={getProfile}
            />
          );
        }}
      />
    </div>
  );
}
