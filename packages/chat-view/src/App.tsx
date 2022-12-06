import Footer from "./components/Footer";
import MessageList from "./components/MessageList";
import { ChatProvider, CommunityProvider, AgentProvider } from "utils/react";
import { UIProvider } from "./context/UIContext";
import { useState } from "preact/hooks";
import styles from "./index.scss";
import { EditorProvider } from "./context/EditorContext";

const MainComponent = ({ perspective, source }) => {
  const [ref, setRef] = useState(null);

  return (
    <EditorProvider perspectiveUuid={perspective} channelId={source}>
      <div class={styles.container} ref={setRef}>
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

export default ({ perspective = "", source = "" }) => {
  return (
    <UIProvider>
      <AgentProvider>
        <CommunityProvider perspectiveUuid={perspective}>
          <ChatProvider perspectiveUuid={perspective} channelId={source}>
            <MainComponent
              perspective={perspective}
              source={source}
            ></MainComponent>
          </ChatProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
};
