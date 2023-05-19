import { useRef, useState } from "preact/hooks";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";
import { useEntries } from "@fluxapp/react-web";
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
  const [showToolbar, setShowToolbar] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const editor = useRef(null);

  const { model } = useEntries({
    perspective,
    source,
    model: Message,
  });

  async function submit() {
    try {
      const html = editor.current?.editor.getHTML();
      console.log({ html });
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
      editor.current?.clear();
    } catch (e) {
      console.log(e);
    }
  }

  function onKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  function onOpenEmojiPicker(
    message: Message,
    position: { x: number; y: number }
  ) {
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
      {pickerInfo?.id && (
        <j-emoji-picker
          onChange={onEmojiClick}
          style={{
            position: "absolute",
            zIndex: 999,
            right: `calc(100% - ${pickerInfo.x}px)`,
            top: pickerInfo.y,
          }}
        ></j-emoji-picker>
      )}
      <MessageList
        onEmojiClick={onOpenEmojiPicker}
        onReplyClick={(message) => setReplyMessage(message)}
        perspective={perspective}
        agent={agent}
        source={source}
      />
      <footer className={styles.footer}>
        {replyMessage && (
          <div dangerouslySetInnerHTML={{ __html: replyMessage.body }}></div>
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
