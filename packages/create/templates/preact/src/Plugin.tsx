import styles from "./Plugin.module.css";
import { PerspectiveProxy } from "@coasys/ad4m";
import TodoView from "./components/TodoView";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function Plugin({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";

  return (
    <div className={styles.appContainer}>
      <TodoView perspective={perspective} source={source}></TodoView>
    </div>
  );
}
