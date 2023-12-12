import CommentItem from "../CommentItem";
import { useState, useRef } from "preact/hooks";
import { Message as MessageModel } from "@coasys/flux-api";
import { useSubjects, useMe } from "@coasys/flux-react-web";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import styles from "./CommentSection.module.css";
import Avatar from "../Avatar";

export default function CommentSection({
  agent,
  perspective,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}) {
  const myAgent = useMe(agent);

  const editor = useRef(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const { entries: comments, repo } = useSubjects({
    perspective,
    source: source || null,
    subject: MessageModel,
  });

  function onKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  async function submit() {
    try {
      const html = editor.current?.editor.getHTML();
      editor.current?.clear();
      const message = await repo.create({
        body: html,
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.base} part="base">
      <j-flex a="center" gap="400">
        <div>
          <Avatar
            size="sm"
            did={myAgent.me?.did}
            url={myAgent.profile?.profileThumbnailPicture}
          ></Avatar>
        </div>
        <flux-editor
          part="editor"
          ref={editor}
          onKeydown={onKeydown}
          aria-expanded={showToolbar}
          className={styles.editor}
          perspective={perspective}
          agent={agent}
          source={source}
        >
          <footer className={styles.footer} slot="footer">
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
            <j-button
              onClick={submit}
              className={styles.submitButton}
              size="sm"
              variant="primary"
            >
              Publish
            </j-button>
          </footer>
        </flux-editor>
      </j-flex>
      {comments.length > 0 && (
        <div className={styles.comments} part="comments">
          {comments.map((comment) => (
            <CommentItem
              agent={agent}
              perspective={perspective}
              comment={comment}
            ></CommentItem>
          ))}
        </div>
      )}
    </div>
  );
}
