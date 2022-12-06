import PostList from "./components/PostList";
import { CommunityProvider, AgentProvider } from "utils/react";
import UIContext, { UIProvider, View } from "./context/UIContext";
import styles from "./index.scss";
import { ChannelProvider } from "utils/react";
import Header from "./components/Header";
import { useContext } from "preact/hooks";
import Post from "./components/Post";

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

  return (
    <>
      <div style={{ display: UIState.view === View.Feed ? "block" : "none" }}>
        <Feed></Feed>
      </div>
      {UIState.currentPost && (
        <div style={{ display: UIState.view === View.Post ? "block" : "none" }}>
          <Post
            perspectiveUuid={perspective}
            source={source}
            id={UIState.currentPost}
          ></Post>
        </div>
      )}
    </>
  );
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
            <div class={styles.container}>
              <Main perspective={perspective} source={source}></Main>
            </div>
          </ChannelProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
}
