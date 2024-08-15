import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { PerspectiveProxy, Literal, LinkQuery } from "@coasys/ad4m";
import { useAgent, useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, generateWCName } from "@coasys/flux-api";
import { name } from "../../../package.json";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import MessageList from "../MessageList/MessageList";
import { community } from "@coasys/flux-constants";
import { getPosition } from "../../utils/getPosition";

import styles from "./ChatView.module.css";
import { EntryType, Profile } from "@coasys/flux-types";
import Avatar from "../Avatar";
import { profileFormatter } from "@coasys/flux-utils";
// @ts-ignore
import EmbedingWorker from "@coasys/flux-utils/src/embeddingWorker?worker&inline";
import MessageItem from "../MessageItem";

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
  const editor = useRef(null);
  const threadContainer = useRef(null);
  const worker = useRef<Worker | null>(null);
  const [similarityMessages, setSimilarityMessages] = useState<Message[]>([]);
  const [showSimilarityModal, setShowSimilarityModal] = useState(false);

  const { profile: replyProfile } = useAgent<Profile>({
    client: agent,
    did: replyMessage?.author,
    formatter: profileFormatter
  });

  const { repo } = useSubjects({
    perspective,
    source,
    subject: Message,
  });

  useEffect(() => {
    // Reset reply and thread
    setThreadSource(null);
    setReplyMessage(null);
  }, [perspective.uuid, source]);

  const { profile: threadProfile } = useAgent<Profile>({
    client: agent,
    did: threadSource?.author,
    formatter: profileFormatter
  });

  useEffect(() => {
    worker.current = new EmbedingWorker();

    worker.current.onmessage = async (e) => {
      if (e.data.type === "embed") {
        const { text, embedding, messageId } = e.data;
        
        await repo.update(messageId, { embedding: Array.from(embedding) });
      } else if (e.data.type === "similarity") {
        console.log("similarity: ", e.data.messages);
        setSimilarityMessages(e.data.messages);
        setShowSimilarityModal(true);
      }
    }

    return () => {
      worker.current?.terminate();
    };
  }, [])

  async function submit() {
    try {
      const html = editor.current?.editor.getHTML();
      const text = editor.current?.editor.getText();
      editor.current?.clear();
      const message = await repo.create({
        body: html,
      });

      console.log("message created: ", message);

      worker.current.postMessage({
        type: "embed",
        text: text,
        // @ts-ignore
        messageId: message?.id,
      })

      if (replyMessage) {
        perspective.addLinks([
          {
            source: replyMessage.id,
            predicate: REPLY_TO,
            target: message.id,
          },
          {
            source: replyMessage.id,
            predicate: EntryType.Message,
            target: message.id,
          },
        ]);
      }
      setReplyMessage(null);
    } catch (e) {
      console.log(e);
    }
  }

  async function queryEmbedding(text: string) {
    const worker = new EmbedingWorker();

    return new Promise((resolve, reject) => {
      worker.postMessage({
        type: "query-embed",
        text,
        messageId: new Date().getTime().toString(),
      });

      worker.onmessage = (e) => {
        if (e.data.type === "query-embed") {
          resolve(e.data.embedding);
        }
      }
    });
  }

  async function similarity(query: string = "food") {
    const queryEmbed = await queryEmbedding(query);
    const messages = await repo.getAllData();
    const embededMessages = messages.filter((m) => m.embedding && m.embedding.length > 0);
    const embededMessagesFloat = embededMessages.map((m) => {
      return {
        ...m,
        embedding: m.embedding.map((e) => parseFloat(e))
      }
    });

    worker.current.postMessage({
      type: "similarity",
      messages: embededMessagesFloat,
      queryEmbedding: query
    });
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
    setPickerInfo({ x: position.x, y: position.y, id: message.id });
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
      el.setAttribute("source", message.id);
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

        <div style={{position: "absolute", top: 30, zIndex: 100000, width: '100%'}}>
          <j-flex a="center" j="center">
            <j-button onClick={() => similarity()}>
              Search Similarity
            </j-button>
          </j-flex>
        </div>

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
      

      <j-modal 
        open={showSimilarityModal}
        onToggle={(e) => setShowSimilarityModal(e.currentTarget.open)}
      >
          <j-box px="800" py="600">
            <j-box pb="800">
              <j-text nomargin variant="heading">
                Similarity
              </j-text>
            </j-box>
            <j-flex direction="column" gap="400">
              {similarityMessages.map((m) => (
                <j-box key={m.id} p="400" border="1px solid var(--j-color-gray-300)">
                  <j-flex direction="column" gap="200">
                    <MessageItem 
                      agent={agent}
                      message={m}
                      perspective={perspective}
                      showAvatar={true}
                      isReplying={false}
                      isThread={false}
                      hideToolbar={true}
                    />
                    <j-box px="400">
                      <j-text variant="label" >
                        Similarity: {m.similarity}
                      </j-text>
                    </j-box>
                  </j-flex>
                </j-box>
              ))}
            </j-flex>
          </j-box>
      </j-modal>

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
                ></j-text>
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
