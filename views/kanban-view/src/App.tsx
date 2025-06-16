import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import styles from "./App.module.css";
import KanbanView from "./components/Board";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";

  return (
    <div className={styles.appContainer}>
      <KanbanView agent={agent} perspective={perspective} source={source} />
    </div>
  );
}
