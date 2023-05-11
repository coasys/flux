import Footer from "./components/Footer";
import MessageList from "./components/MessageList";
import {
  ChatProvider,
  CommunityProvider,
  AgentProvider,
} from "@fluxapp/react-web";
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

const MainComponent = ({ perspective, source }) => {
  const [ref, setRef] = useState(null);

  return (
    <EditorProvider perspectiveUuid={perspective} channelId={source}>
      <div className={styles.container} ref={setRef}>
        <MessageList
          perspectiveUuid={perspective}
          channelId={source}
          mainRef={ref}
        />
        <Footer perspectiveUuid={perspective} channelId={source} />
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
  if (!perspective?.uuid || !source) {
    return null;
  }

  return (
    <UIProvider>
      <AgentProvider>
        <CommunityProvider agent={agent} perspective={perspective}>
          <ChatProvider perspectiveUuid={perspective.uuid} channelId={source}>
            <MainComponent
              perspective={perspective.uuid}
              source={source}
            ></MainComponent>
          </ChatProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
}
