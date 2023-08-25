import styles from "./App.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import TodoView from "./components/Board";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import CommentSection from "@fluxapp/comment-section";

if (!customElements.get("comment-section")) {
  customElements.define("comment-section", CommentSection);
}

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";

  return (
    <div className={styles.appContainer}>
      <TodoView
        agent={agent}
        perspective={perspective}
        source={source}
      ></TodoView>
    </div>
  );
}
