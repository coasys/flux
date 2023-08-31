import styles from "./App.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import TableView from "./components/TableView";
import "@fluxapp/ui/dist/main.d.ts";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";
  return (
    <div className={styles.appContainer}>
      <TableView
        agent={agent}
        perspective={perspective}
        source={source}
      ></TableView>
    </div>
  );
}
