import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import "@coasys/flux-ui/dist/main.d.ts";
import styles from "./App.module.css";
import SynergyDemoView from "./components/SynergyDemoView";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  appStore: any;
};

export default function App({ agent, perspective, source, appStore }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";
  return (
    <div className={styles.appContainer}>
      <SynergyDemoView
        agent={agent}
        perspective={perspective}
        source={source}
        appStore={appStore}
      />
    </div>
  );
}
