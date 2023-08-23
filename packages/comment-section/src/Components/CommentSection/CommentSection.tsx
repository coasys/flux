import CommentItem from "../CommentItem";
import { useState, useRef } from "preact/hooks";
import { Message as MessageModel } from "@fluxapp/api";
import { useEntries } from "@fluxapp/react-web";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import styles from "./CommentSection.module.css";

export default function CommentSection({
  agent,
  perspective,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}) {
  const editor = useRef(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const { entries: comments, model } = useEntries({
    perspective,
    source: source || null,
    model: MessageModel,
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
      const message = await model.create({
        body: html,
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.base} part="base">
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
        <footer slot="footer">
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
          <j-button onClick={submit} class="submit" size="sm" variant="primary">
            Publish
          </j-button>
        </footer>
      </flux-editor>
    </div>
  );
}
