import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import "@coasys/flux-ui/dist/main.d.ts";
import styles from "./App.module.scss";
import DecisionTreeView from "./components/DecisionTreeView";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";
  return (
    <div className={styles.wrapper}>
      <DecisionTreeView agent={agent} perspective={perspective} source={source} />
    </div>
  );
}
