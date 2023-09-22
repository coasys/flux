import styles from "./App.module.css";
import { PerspectiveProxy, Ad4mClient } from "@perspect3vism/ad4m";
import ChatView from "./components/ChatView/ChatView";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  threaded: string;
  element: HTMLElement;
};

export default function App({
  agent,
  perspective,
  source,
  threaded,
  element,
}: Props) {
  if (!perspective?.uuid || !agent)
    return <div>"No perspective or agent client"</div>;

  return (
    <div className={styles.appContainer}>
      <ChatView
        element={element}
        agent={agent}
        perspective={perspective}
        source={source}
        threaded={!!threaded}
      ></ChatView>
    </div>
  );
}
