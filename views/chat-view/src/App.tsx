import styles from "./App.module.css";
import { PerspectiveProxy, Ad4mClient } from "@perspect3vism/ad4m";
import ChatView from "./components/ChatView/ChatView";
import "@fluxapp/ui/dist/main.d.ts";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  threaded: string;
};

export default async function App({
  agent,
  perspective,
  source,
  threaded,
}: Props) {
  if (!perspective?.uuid || !agent || !source)
    return "No perspective or agent client";

  return (
    <div className={styles.appContainer}>
      <ChatView
        agent={agent}
        perspective={perspective}
        source={source}
        threaded={!!threaded}
      ></ChatView>
    </div>
  );
}
