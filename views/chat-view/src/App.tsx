import styles from "./App.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import ChatView from "./components/ChatView/ChatView";
import "@fluxapp/ui/dist/main.d.ts";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  isThread: string;
};

export default function App({ agent, perspective, source, isThread }: Props) {
  if (!perspective?.uuid || !agent || !source)
    return "No perspective or agent client";

  return (
    <div className={styles.appContainer}>
      <ChatView
        agent={agent}
        perspective={perspective}
        source={source}
        isThread={!!isThread}
      ></ChatView>
    </div>
  );
}
