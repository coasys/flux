import Footer from "./components/Footer";
import MessageList from "./components/MessageList";
import { ChatProvider } from "@fluxapp/react-web";
import { UIProvider } from "./context/UIContext";
import { useState } from "preact/hooks";
import styles from "./index.module.css";
import { EditorProvider } from "./context/EditorContext";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

// dynamic import of emoji picker only if it's not defined already
if (customElements.get("emoji-picker") === undefined) {
  import("emoji-picker-element");
}

const MainComponent = ({ perspective, agent, source }) => {
  const [ref, setRef] = useState(null);

  return (
    <EditorProvider
      perspective={perspective}
      agent={agent}
      perspectiveUuid={perspective.uuid}
      channelId={source}
    >
      <div className={styles.container} ref={setRef}>
        <MessageList
          agent={agent}
          perspectiveUuid={perspective.uuid}
          channelId={source}
          mainRef={ref}
        />
        <Footer
          agent={agent}
          perspectiveUuid={perspective.uuid}
          channelId={source}
        />
      </div>
    </EditorProvider>
  );
};

export default function App({
  perspective,
  agent,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}) {
  if (!perspective?.uuid || !source || !agent) {
    return null;
  }

  return (
    <UIProvider>
      <ChatProvider perspectiveUuid={perspective.uuid} channelId={source}>
        <MainComponent
          agent={agent}
          perspective={perspective}
          source={source}
        ></MainComponent>
      </ChatProvider>
    </UIProvider>
  );
}
