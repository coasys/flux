import { LinkQuery, PerspectiveProxy } from "@coasys/ad4m";
import { useAgent, useSubjects } from "@coasys/ad4m-react-hooks";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Message } from "@coasys/flux-api";
import { community } from "@coasys/flux-constants";
import { EntryType, Profile } from "@coasys/flux-types";
import { profileFormatter } from "@coasys/flux-utils";
import { useEffect, useRef, useState } from "preact/hooks";
import { getPosition } from "../../utils/getPosition";
import Avatar from "../Avatar";
import MessageList from "../MessageList/MessageList";
import styles from "./ChatView.module.css";

const { REPLY_TO, REACTION } = community;

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  threaded?: boolean;
  element: HTMLElement;
};

export default function ChatView({
  agent,
  perspective,
  source,
  threaded,
  element,
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
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const editor = useRef(null);
  const threadContainer = useRef(null);

  const { profile: replyProfile } = useAgent<Profile>({
    client: agent,
    did: replyMessage?.author,
    formatter: profileFormatter,
  });

  const { profile: threadProfile } = useAgent<Profile>({
    client: agent,
    did: threadSource?.author,
    formatter: profileFormatter,
  });

  async function submit() {
    try {
      const html = editor.current?.editor.getHTML();
      const text = editor.current?.editor.getText();
      editor.current?.clear();

      // @ts-ignore
      const message = new Message(perspective, undefined, source);
      message.body = html;
      await message.save();

      // Pass the new message to the MessageList component and then reset the state
      setNewMessage(message);
      setTimeout(() => setNewMessage(null), 100);

      if (replyMessage) {
        perspective.addLinks([
          {
            source: replyMessage.baseExpression,
            predicate: REPLY_TO,
            target: message.baseExpression,
          },
          {
            source: replyMessage.baseExpression,
            predicate: EntryType.Message,
            target: message.baseExpression,
          },
        ]);
      }
      setReplyMessage(null);
    } catch (e) {
      console.error(e);
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
    setPickerInfo({ x: position.x, y: position.y, id: message.baseExpression });
  }

  async function onOpenThread(message: Message) {
    setThreadSource(message);

    const container = threadContainer.current;

    if (container) {
      const wc = container.querySelector(element.localName);
      let el = wc;

      if (!el) {
        el = document.createElement(element.localName);
        container.append(el);
      }
      el.className = styles.webComponent;
      el.perspective = perspective;
      el.agent = agent;
      el.setAttribute("source", message.baseExpression);
      el.setAttribute("threaded", "true");
    }
  }

  function onCloseThread() {
    setThreadSource(null);
    threadContainer?.current.lastChild.remove();
  }

  async function onEmojiClick(e) {
    if (pickerInfo.id) {
      const emojiExpression = `emoji://${e.detail.unified}`;
      const me = await agent.me();
      const reactions = await perspective.get(
        new LinkQuery({
          source: pickerInfo.id,
          predicate: REACTION,
          target: emojiExpression,
        })
      );

      const myReactions = reactions.filter((l) => l.author === me.did);

      if (myReactions.length > 0) {
        perspective.removeLinks(myReactions);
      } else {
        perspective.add({
          source: pickerInfo.id,
          predicate: REACTION,
          target: emojiExpression,
        });
      }
    }
    setPickerInfo(null);
  }

  useEffect(() => {
    // Reset reply and thread
    setThreadSource(null);
    setReplyMessage(null);
  }, [perspective.uuid, source]);

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
      />

      <div className={styles.inner}>
        <MessageList
          onEmojiClick={onOpenEmojiPicker}
          onReplyClick={(message) => setReplyMessage(message)}
          onThreadClick={(message) => onOpenThread(message)}
          replyId={replyMessage?.baseExpression}
          perspective={perspective}
          isThread={threaded}
          agent={agent}
          source={source}
          newMessage={newMessage}
        />

        <footer className={styles.footer}>
          {replyMessage && (
            <j-box py="300">
              <j-flex a="center" gap="400">
                <j-button
                  onClick={() => setReplyMessage(null)}
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
                  Replying to @{replyProfile?.username}
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
                className="submit"
                circle
                square
                size="sm"
                variant="primary"
              >
                <j-icon size="xs" name="send"></j-icon>
              </j-button>
              <j-button
                className="toggle-formatting"
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
                <j-text size="300" className={styles.body} nomargin uppercase>
                  Thread with
                </j-text>
                <Avatar
                  size="xxs"
                  profileAddress={threadProfile?.profileThumbnailPicture}
                  hash={threadSource?.author}
                />
                <span>{threadProfile?.username}</span>
                <j-text
                  size="300"
                  className={styles.body}
                  nomargin
                  dangerouslySetInnerHTML={{ __html: threadProfile?.body }}
                />
              </j-flex>
              <j-button
                onClick={onCloseThread}
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
