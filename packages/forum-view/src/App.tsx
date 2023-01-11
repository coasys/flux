import PostList from "./components/PostList";
import { CommunityProvider, AgentProvider } from "utils/react";
import UIContext, { UIProvider, View } from "./context/UIContext";
import styles from "./index.module.css";
import { ChannelProvider } from "utils/react";
import Header from "./components/Header";
import { useContext } from "preact/hooks";
import Post from "./components/Post";
import Overlay from "./components/Overlay/Overlay";

function Feed() {
  return (
    <>
      <Header></Header>
      <PostList />
    </>
  );
}

function Main({
  perspective,
  source,
}: {
  perspective: string;
  source: string;
}) {
  const { state: UIState } = useContext(UIContext);

  switch (UIState.view) {
    case View.Feed:
      return <Feed></Feed>;
    case View.Post:
      return (
        UIState.currentPost && (
          <Post
            perspectiveUuid={perspective}
            source={source}
            id={UIState.currentPost}
          ></Post>
        )
      );
  }
}

export default function App({
  perspective,
  source,
}: {
  perspective: string;
  source: string;
}) {
  return (
    <UIProvider>
      <AgentProvider>
        <CommunityProvider perspectiveUuid={perspective}>
          <ChannelProvider communityId={perspective} channelId={source}>
            <div className={styles.container}>
              <Main perspective={perspective} source={source}></Main>
            </div>
            <Overlay />
          </ChannelProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
}
