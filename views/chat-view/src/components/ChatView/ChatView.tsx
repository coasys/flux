import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { useAgent, useEntries } from "@fluxapp/react-web";
import { Message } from "@fluxapp/api";
import styles from "./ChatView.module.css";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import MessageList from "../MessageList/MessageList";
import { community } from "@fluxapp/constants";

const { REPLY_TO, REACTION } = community;

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function ChatView({ agent, perspective, source }: Props) {
  const emojiPicker = useRef();
  const [showToolbar, setShowToolbar] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const editor = useRef(null);

  const { profile: replyProfile } = useAgent({
    client: agent,
    did: replyMessage?.author,
  });

  const { model } = useEntries({
    perspective,
    source,
    model: Message,
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
    <>
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

      <MessageList
        onEmojiClick={onOpenEmojiPicker}
        onReplyClick={(message) => setReplyMessage(message)}
        replyId={replyMessage?.id}
        perspective={perspective}
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
    </>
  );
}

type Position = {
  left: string;
  right: string;
  top: string;
  bottom: string;
};

function getPosition(x: number, y: number, el: HTMLElement): Position {
  if (x === undefined || y === undefined || el === undefined) {
    return { right: "", top: "", left: "", bottom: "" };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const elementWidth = el.offsetWidth;
  const elementHeight = el.offsetHeight;

  const right = viewportWidth - x;
  const top = y;

  let rightVal = "";
  let leftVal = "";
  let topVal = "";
  let bottomVal = "";

  if (right < elementWidth) {
    rightVal = `${right}px`;
    leftVal = "";
  } else {
    rightVal = "";
    leftVal = `${x}px`;
  }

  if (top + elementHeight > viewportHeight) {
    bottomVal = `${viewportHeight - y}px`;
    topVal = "";
  } else {
    bottomVal = "";
    topVal = `${y}px`;
  }

  return {
    right: rightVal,
    left: leftVal,
    top: topVal,
    bottom: bottomVal,
  };
}
