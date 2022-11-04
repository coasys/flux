import Header from "./components/Header";
import MessageList from "./components/MessageList";
import { ChatProvider, PerspectiveProvider, AgentProvider } from "utils/react";
import { UIProvider } from "./context/UIContext";
import { useState } from "preact/hooks";
import styles from "./index.scss";
import { EditorProvider } from "./context/EditorContext";

const MainComponent = ({ perspectiveUuid, channel }) => {
  const [ref, setRef] = useState(null);

  return (
    <EditorProvider perspectiveUuid={perspectiveUuid} channelId={channel}>
      <div class={styles.container} ref={setRef}>
        <MessageList
          perspectiveUuid={perspectiveUuid}
          channelId={channel}
          mainRef={ref}
        />
      </div>
    </EditorProvider>
  );
};

export default ({ perspectiveUuid = "", port = "", channel = "" }) => {
  console.log({ perspectiveUuid, port, channel });

  return (
    <UIProvider>
      <AgentProvider>
        <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
          <ChatProvider perspectiveUuid={perspectiveUuid} channelId={channel}>
            <MainComponent
              perspectiveUuid={perspectiveUuid}
              channel={channel}
            ></MainComponent>
          </ChatProvider>
        </PerspectiveProvider>
      </AgentProvider>
    </UIProvider>
  );
};
