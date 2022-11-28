import MessageList from "./components/MessageList";
import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
  CommunityProvider,
} from "utils/react";
import UIContext, { UIProvider, View } from "./context/UIContext";
import styles from "./index.scss";
import { ChannelProvider } from "utils/react/ChannelContext";
import Header from "./components/Header";
import { useContext } from "preact/hooks";
import Post from "./components/Post";

function Feed() {
  return (
    <>
      <Header></Header>
      <MessageList />
    </>
  );
}

function Main() {
  const { state } = useContext(UIContext);

  switch (state.view) {
    case View.Feed:
      return <Feed></Feed>;
    case View.Post:
      return <Post></Post>;
  }
}

export default ({ perspective, source }) => {
  return (
    <UIProvider>
      <AgentProvider>
        <CommunityProvider perspectiveUuid={perspective}>
          <PerspectiveProvider perspectiveUuid={perspective}>
            <ChannelProvider communityId={perspective} channelId={source}>
              <ChatProvider perspectiveUuid={perspective} channelId={source}>
                <div class={styles.container}>
                  <Main></Main>
                </div>
              </ChatProvider>
            </ChannelProvider>
          </PerspectiveProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
};
