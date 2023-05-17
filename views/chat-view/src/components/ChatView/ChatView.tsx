import { useRef, useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntries } from "@fluxapp/react-web";
import { Message } from "@fluxapp/api";
import { Virtuoso } from "react-virtuoso";
import MessageItem from "../MessageItem";
import styles from "./ChatView.module.css";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

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

export default function ChatView({ agent, perspective, source }: Props) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [content, setContent] = useState("");
  const editor = useRef(null);
  const { entries: messages, model } = useEntries({
    perspective,
    source,
    model: Message,
  });

  function onChange(e) {
    const { html } = e.detail;
    setContent(html);
  }

  function submit() {
    model.create({ body: editor.current?.editor.getHTML() });
    editor.current?.clear();
  }

  function onKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

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
    <>
      <div className={styles.messageList}>
        <Virtuoso
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
                perspective={perspective}
                showAvatar={showAvatar(index)}
                key={messages[index].id}
                agent={agent}
                message={messages[index]}
              ></MessageItem>
            );
          }}
        />
      </div>
      <footer className={styles.footer}>
        <flux-editor
          ref={editor}
          onKeydown={onKeydown}
          onChange={onChange}
          className={styles.editor}
          aria-expanded={showToolbar}
          perspective={perspective}
          agent={agent}
          source={source}
        >
          <footer slot="footer">
            <j-button
              onClick={submit}
              class="submit"
              circle
              square
              size="sm"
              variant="primary"
            >
              <j-icon size="xs" name="send"></j-icon>
            </j-button>
            <j-button
              class="toggle-formatting"
              onClick={() => setShowToolbar(!showToolbar)}
              circle
              square
              size="sm"
              variant="ghost"
            >
              <j-icon size="sm" name="type"></j-icon>
            </j-button>
          </footer>
        </flux-editor>
      </footer>
    </>
  );
}
