import styles from "./App.module.css";
import { PerspectiveProxy } from "@coasys/ad4m";
import SynergyDemoView from "./components/SynergyDemoView";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";
  return (
    <div className={styles.appContainer}>
      <SynergyDemoView
        agent={agent}
        perspective={perspective}
        source={source}
      ></SynergyDemoView>
    </div>
  );
}
