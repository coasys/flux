import Footer from "./components/Footer";
import MessageList from "./components/MessageList";
import {
  ChatProvider,
  CommunityProvider,
  AgentProvider,
} from "utils/frameworks/react";
import { UIProvider } from "./context/UIContext";
import { useState } from "preact/hooks";
import styles from "./index.module.css";
import { EditorProvider } from "./context/EditorContext";

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

export default ({ perspective = "", source = "" }) => {
  if (!perspective || !source) {
    return null;
  }

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
