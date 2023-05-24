import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { useAgent, useEntries } from "@fluxapp/react-web";
import { Message, generateWCName } from "@fluxapp/api";
import { name } from "../../../package.json";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import MessageList from "../MessageList/MessageList";
import { community } from "@fluxapp/constants";
import { getPosition } from "../../utils/getPosition";

import styles from "./ChatView.module.css";
import { EntryType } from "@fluxapp/types";

const { REPLY_TO, REACTION } = community;

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  threaded?: boolean;
};

export default function ChatView({
  agent,
  perspective,
  source,
  threaded,
}: Props) {
  const emojiPicker = useRef();
  const [showToolbar, setShowToolbar] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);
  const [threadSource, setThreadSource] = useState<Message | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const editor = useRef(null);
  const threadContainer = useRef(null);

  const { profile: replyProfile } = useAgent({
    client: agent,
    did: replyMessage?.author,
  });

  const { model } = useEntries({
    perspective,
    source,
    model: Message,
  });

  const { profile: threadProfile } = useAgent({
    client: agent,
    did: threadSource?.author,
  });

  async function submit() {
    try {
      const html = editor.current?.editor.getHTML();
      editor.current?.clear();
      const message = await model.create({
        body: html,
      });
      if (replyMessage) {
        perspective.add({
          source: replyMessage.id,
          predicate: REPLY_TO,
          target: message.id,
        });
        perspective.add({
          source: replyMessage.id,
          predicate: EntryType.Message,
          target: message.id,
        });
      }
      setReplyMessage(null);
    } catch (e) {
      console.log(e);
    }
  }

  function onKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onOpenEmojiPicker(
    message: Message,
    position: { x: number; y: number }
  ) {
    console.log("open");
    setPickerInfo({ x: position.x, y: position.y, id: message.id });
  }

  async function onOpenThread(message: Message) {
    setThreadSource(message);
    const wcName = await generateWCName(name);

    const container = threadContainer.current;

    if (container) {
      const wc = container.querySelector(wcName);
      let el = wc;

      if (!el) {
        el = document.createElement(wcName);
        container.append(el);
      }
      el.className = styles.webComponent;

      el.perspective = perspective;
      el.setAttribute("source", message.id);
      el.setAttribute("threaded", "true");
      el.agent = agent;
    }
  }

  function onCloseThread() {
    setThreadSource(null);
    threadContainer?.current.lastChild.remove();
  }

  function onEmojiClick(e) {
    if (pickerInfo.id) {
      perspective.add({
        source: pickerInfo.id,
        predicate: REACTION,
        target: Literal.from(e.detail.native).toUrl(),
      });
    }
    setPickerInfo(null);
  }

  return (
    <div
      className={styles.wrapper}
      data-threaded={threaded}
      data-show-thread={!!threadSource}
    >
      <j-emoji-picker
        onclickoutside={() => setPickerInfo(null)}
        onChange={onEmojiClick}
        ref={emojiPicker}
        style={{
          display: pickerInfo?.id ? "block" : "none",
          position: "absolute",
          zIndex: 999,
          ...getPosition(pickerInfo?.x, pickerInfo?.y, emojiPicker?.current),
        }}
      ></j-emoji-picker>

      <div className={styles.inner}>
        <MessageList
          onEmojiClick={onOpenEmojiPicker}
          onReplyClick={(message) => setReplyMessage(message)}
          onThreadClick={(message) => onOpenThread(message)}
          replyId={replyMessage?.id}
          perspective={perspective}
          isThread={threaded}
          agent={agent}
          source={source}
        />

        <footer className={styles.footer}>
          {replyMessage && (
            <j-box py="300">
              <j-flex a="center" gap="400">
                <j-button
                  onclick={() => setReplyMessage(null)}
                  size="xs"
                  circle
                  square
                  variant="primary"
                >
                  <j-icon size="xs" name="x"></j-icon>
                </j-button>
                <j-text
                  uppercase
                  nomargin
                  color="primary-500"
                  weight="800"
                  size="300"
                >
                  Replying to @{replyProfile.username}
                </j-text>
              </j-flex>
            </j-box>
          )}
          <flux-editor
            ref={editor}
            onKeydown={onKeydown}
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
      </div>

      <div ref={threadContainer} className={styles.thread}>
        <div className={styles.threadHeader}>
          <j-box p="400">
            <j-flex a="center" j="between" gap="200">
              <j-flex a="center" gap="200">
                <j-text size="300" class={styles.body} nomargin uppercase>
                  Thread with
                </j-text>
                <j-avatar
                  size="xxs"
                  src={threadProfile?.profileThumbnailPicture}
                  hash={threadSource?.author}
                ></j-avatar>
                <span>{threadProfile?.username}</span>
                <j-text
                  size="300"
                  class={styles.body}
                  nomargin
                  dangerouslySetInnerHTML={{ __html: threadProfile?.body }}
                ></j-text>
              </j-flex>
              <j-button
                onclick={onCloseThread}
                size="xs"
                circle
                square
                variant="primary"
              >
                <j-icon size="xs" name="x"></j-icon>
              </j-button>
            </j-flex>
          </j-box>
        </div>
      </div>
    </div>
  );
}
