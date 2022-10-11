import Header from "./components/Header";
import Footer from "./components/Footer";
import MessageList from "./components/MessageList";

import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
} from "utils/react";
import { UIProvider } from "./context/UIContext";
import { useState } from "preact/hooks";
import styles from "./index.scss";

const MainComponent = ({ perspectiveUuid, channel }) => {
  const [ref, setRef] = useState(null);

  return (
    <div class={styles.container} ref={setRef}>
      <MessageList
        perspectiveUuid={perspectiveUuid}
        channelId={channel}
        mainRef={ref}
      />
      <Footer />
    </div>
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
