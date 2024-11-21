import styles from "./Plugin.module.css";
import { PerspectiveProxy } from "@coasys/ad4m";
import FileView from "./components/FileView";
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
      <FileView
        perspective={perspective}
        source={source}
        agent={agent}
      ></FileView>
    </div>
  );
}
