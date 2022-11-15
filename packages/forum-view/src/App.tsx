import MessageList from "./components/MessageList";
import { ChatProvider, PerspectiveProvider, AgentProvider } from "utils/react";
import { UIProvider } from "./context/UIContext";
import styles from "./index.scss";
import { EditorProvider } from "./context/EditorContext";

const MainComponent = ({ perspectiveUuid, channel }) => {
  return (
    <EditorProvider perspectiveUuid={perspectiveUuid} channelId={channel}>
      <div class={styles.container}>
        <MessageList perspectiveUuid={perspectiveUuid} channelId={channel} />
      </div>
    </EditorProvider>
  );
};

export default ({ perspectiveUuid = "", port = "", channel = "" }) => {
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
